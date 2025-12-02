package com.pham.christmastree.service;

import com.pham.christmastree.model.Message;

import java.util.List;

public interface MessageService {
    Message createMessage(String description);
    List<Message> getMessages();
}
