package com.fitness.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Returned on successful login/register - carries the JWT the client will
// attach as "Authorization: Bearer <token>" on every subsequent request.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
}
