package com.pham.christmastree.controller;


import com.pham.christmastree.model.Message;
import com.pham.christmastree.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> create(@RequestParam String description) {
        Message createdMessage = messageService.createMessage(description);
        return ResponseEntity.ok(createdMessage);
    }

    @GetMapping
    public ResponseEntity<List<Message>> getAll() {
        return ResponseEntity.ok(messageService.getMessages());
    }
}
