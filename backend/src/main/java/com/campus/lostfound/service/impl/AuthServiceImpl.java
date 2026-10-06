package com.campus.lostfound.service.impl;

import com.campus.lostfound.dto.auth.AuthResponse;
import com.campus.lostfound.dto.auth.LoginRequest;
import com.campus.lostfound.dto.auth.RegisterRequest;
import com.campus.lostfound.dto.auth.UserDto;
import com.campus.lostfound.entity.AuditAction;
import com.campus.lostfound.entity.AuditLog;
import com.campus.lostfound.entity.User;
import com.campus.lostfound.entity.UserRole;
import com.campus.lostfound.entity.UserStatus;
import com.campus.lostfound.exception.AccountBlockedException;
import com.campus.lostfound.exception.EmailAlreadyExistsException;
import com.campus.lostfound.exception.InvalidCredentialsException;
import com.campus.lostfound.exception.ResourceNotFoundException;
import com.campus.lostfound.repository.AuditLogRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.security.JwtTokenProvider;
import com.campus.lostfound.security.UserPrincipal;
import com.campus.lostfound.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String trimmedName = request.getName().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Registration failed: Email '{}' is already in use", normalizedEmail);
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        // Server-enforced defaults: role is always STUDENT, status is always ACTIVE
        User user = new User(
                trimmedName,
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                UserRole.STUDENT,
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);
        log.info("Registered new user with ID {} and role {}", savedUser.getId(), savedUser.getRole());

        // Safe audit log without any credentials
        AuditLog auditLog = new AuditLog(
                savedUser,
                AuditAction.USER_REGISTERED,
                "USER",
                savedUser.getId(),
                "{\"email\":\"" + normalizedEmail + "\",\"role\":\"STUDENT\"}"
        );
        auditLogRepository.save(auditLog);

        String token = jwtTokenProvider.generateToken(savedUser);
        return new AuthResponse(token, UserDto.fromEntity(savedUser));
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed: Non-existent email '{}'", normalizedEmail);
                    return new InvalidCredentialsException();
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: Incorrect password for user '{}'", normalizedEmail);
            throw new InvalidCredentialsException();
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            log.warn("Login blocked: User '{}' is BLOCKED", normalizedEmail);
            throw new AccountBlockedException();
        }

        log.info("User logged in successfully: ID {}", user.getId());

        String token = jwtTokenProvider.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        if (user.getStatus() == UserStatus.BLOCKED) {
            log.warn("Blocked user '{}' attempted to access /api/auth/me", user.getEmail());
            throw new AccountBlockedException();
        }

        return UserDto.fromEntity(user);
    }
}
