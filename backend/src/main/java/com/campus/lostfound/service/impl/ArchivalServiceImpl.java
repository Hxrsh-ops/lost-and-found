package com.campus.lostfound.service.impl;

import com.campus.lostfound.entity.*;
import com.campus.lostfound.exception.ConflictException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.ItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ArchivalService;
import com.campus.lostfound.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ArchivalServiceImpl implements ArchivalService {

    private static final Logger log = LoggerFactory.getLogger(ArchivalServiceImpl.class);

    private final ItemRepository itemRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${app.lifecycle.archive-after-days:30}")
    private int archiveAfterDays;

    public ArchivalServiceImpl(ItemRepository itemRepository,
                               AuditLogRepository auditLogRepository,
                               UserRepository userRepository,
                               NotificationService notificationService) {
        this.itemRepository = itemRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public int archiveEligibleItems() {
        Instant cutoff = Instant.now().minus(archiveAfterDays, ChronoUnit.DAYS);
        log.info("Running automatic item archival job for OPEN items created before {} (threshold: {} days)", cutoff, archiveAfterDays);

        List<Item> eligibleItems = itemRepository.findByStatusAndCreatedAtBefore(ItemStatus.OPEN, cutoff);
        int count = 0;
        Instant now = Instant.now();

        for (Item item : eligibleItems) {
            // Re-verify eligibility (idempotent safety)
            if (item.getStatus() == ItemStatus.OPEN) {
                item.setStatus(ItemStatus.ARCHIVED);
                item.setArchivedAt(now);
                itemRepository.save(item);

                // Audit log for automatic archival
                AuditLog audit = new AuditLog(
                        null,
                        AuditAction.ITEM_ARCHIVED,
                        "ITEM",
                        item.getId(),
                        "{\"reason\":\"AUTOMATIC_LIFECYCLE_THRESHOLD\",\"archiveAfterDays\":" + archiveAfterDays + ",\"title\":\"" + item.getTitle() + "\"}"
                );
                auditLogRepository.save(audit);

                // Notify item reporter
                try {
                    notificationService.createNotification(
                            item.getReporter(),
                            NotificationType.ADMIN_ACTION,
                            "Item Archived",
                            "Your reported item \"" + item.getTitle() + "\" was automatically archived after " + archiveAfterDays + " days of inactivity."
                    );
                } catch (Exception e) {
                    log.warn("Failed to send archival notification for item {}: {}", item.getId(), e.getMessage());
                }

                count++;
            }
        }

        log.info("Automatic item archival job completed. Total items archived: {}", count);
        return count;
    }

    @Scheduled(cron = "${app.lifecycle.archive-cron:0 0 2 * * *}")
    public void scheduledArchival() {
        archiveEligibleItems();
    }

    @Override
    public void manuallyArchiveItem(UUID itemId, String adminEmail) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminEmail));

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        if (item.getStatus() == ItemStatus.ARCHIVED) {
            throw new ConflictException("Item is already ARCHIVED");
        }

        Instant now = Instant.now();
        ItemStatus previousStatus = item.getStatus();
        item.setStatus(ItemStatus.ARCHIVED);
        item.setArchivedAt(now);
        itemRepository.save(item);

        // Audit log
        AuditLog audit = new AuditLog(
                admin,
                AuditAction.ITEM_ARCHIVED,
                "ITEM",
                item.getId(),
                "{\"reason\":\"ADMIN_MANUAL_ARCHIVE\",\"previousStatus\":\"" + previousStatus + "\",\"title\":\"" + item.getTitle() + "\"}"
        );
        auditLogRepository.save(audit);

        // Notification to item reporter
        notificationService.createNotification(
                item.getReporter(),
                NotificationType.ADMIN_ACTION,
                "Item Administratively Archived",
                "Your reported item \"" + item.getTitle() + "\" has been archived by campus administration."
        );
    }
}
