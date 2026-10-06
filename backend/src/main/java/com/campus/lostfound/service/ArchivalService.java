package com.campus.lostfound.service;

import java.util.UUID;

public interface ArchivalService {

    /**
     * Finds and archives all OPEN items that have exceeded the configured retention threshold.
     *
     * @return count of newly archived items
     */
    int archiveEligibleItems();

    /**
     * Manually archives an item by administrative action.
     *
     * @param itemId     ID of the item to archive
     * @param adminEmail email of the performing administrator
     */
    void manuallyArchiveItem(UUID itemId, String adminEmail);
}
