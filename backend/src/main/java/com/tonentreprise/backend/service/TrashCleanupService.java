package com.tonentreprise.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class TrashCleanupService {

    @Autowired
    private DocumentModelService documentModelService;

    // tous les jours à 03:00
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupTrash() {
        documentModelService.purgeExpiredTrash();
    }
}
