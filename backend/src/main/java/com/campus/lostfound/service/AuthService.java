package com.campus.lostfound.service;

import com.campus.lostfound.dto.auth.AuthResponse;
import com.campus.lostfound.dto.auth.LoginRequest;
import com.campus.lostfound.dto.auth.RegisterRequest;
import com.campus.lostfound.dto.auth.UserDto;
import com.campus.lostfound.security.UserPrincipal;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserDto getCurrentUser(UserPrincipal principal);
}
