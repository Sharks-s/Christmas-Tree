package com.pham.christmastree.service;

import com.pham.christmastree.model.Message;
import com.pham.christmastree.repository.MessageRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService{
    private final MessageRepo messageRepo;

    @Override
    public Message createMessage(String description) {
        Message message = new Message();
        message.setDescription(description);
        return messageRepo.save(message);
    }

    @Override
    public List<Message> getMessages() {
        return messageRepo.findAll();
    }
}
