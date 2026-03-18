import type { Notification } from '../types';

type NotificationData = {
  postId?: string;
  offerId?: string;
  transactionId?: string;
  ratingId?: string;
  reportId?: string;
};

function parseNotificationData(data?: string): NotificationData {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data) as NotificationData;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getNotificationRoute(notification: Notification): string {
  const data = parseNotificationData(notification.data);

  if (data.transactionId) {
    if (notification.type === 'OFFER_ACCEPTED' || notification.type === 'NEW_MESSAGE') {
      return `/chat/${data.transactionId}`;
    }
    return `/transactions/${data.transactionId}`;
  }

  if (data.postId) {
    return `/posts/${data.postId}`;
  }

  switch (notification.type) {
    case 'OFFER_RECEIVED':
      return '/my-posts';
    case 'OFFER_ACCEPTED':
    case 'OFFER_REJECTED':
      return '/my-offers';
    case 'TRANSACTION_COMPLETE':
      return '/transactions';
    case 'NEW_MESSAGE':
      return '/chat';
    case 'REPORT_UPDATE':
      return '/admin';
    case 'NEW_RATING':
      return '/profile';
    default:
      return '/dashboard';
  }
}
