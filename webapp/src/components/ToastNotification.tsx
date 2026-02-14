import { useEffect } from 'react';
import './ToastNotification.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastNotificationProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export function ToastNotification({
    message,
    type = 'success',
    duration = 3000,
    onClose
}: ToastNotificationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    return (
        <div className={`toast-notification ${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}
