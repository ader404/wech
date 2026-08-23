import { Injectable } from '@nestjs/common';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private notifications: Notification[] = [];

  add(type: string, message: string) {
    this.notifications.unshift({ id: crypto.randomUUID(), type, message, read: false, createdAt: new Date() });
    if (this.notifications.length > 100) this.notifications.pop();
  }

  findAll() {
    return this.notifications;
  }

  markRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) notification.read = true;
    return notification;
  }

  markAllRead() {
    this.notifications.forEach((n) => (n.read = true));
    return this.notifications;
  }
}
