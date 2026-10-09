import { useEffect } from "react";
import type { Reminder, ReminderCategory, ViewMode } from "./reminder-utils";
import { NOTIFICATION_TAP_EVENT, PENDING_NOTIFICATION_REMINDER_ID_KEY, PENDING_NOTIFICATION_ACTION_KEY } from "./notifications";

type NotificationTapHandlerOptions = {
    reminders: Reminder[];
    setActiveMainTab: (value: "reminders" | "lists") => void;
    setIsTutorialOpen: (value: boolean) => void;
    setIsOverlayOpen: (value: boolean) => void;
    setIsListsOverlayOpen: (value: boolean) => void;
    setIsRepeatsOverlayOpen: (value: boolean) => void;
    setViewMode: (value: ViewMode) => void;
    setActiveFilter: (value: ReminderCategory | "all") => void;
    setInfoReminder: (reminder: Reminder | null) => void;
    onMarkAsDone: (reminderId: string) => void;
    onMoveToTomorrow: (reminderId: string) => void;
};

export function useNotificationTapHandler({
    reminders,
    setActiveMainTab,
    setIsTutorialOpen,
    setIsOverlayOpen,
    setIsListsOverlayOpen,
    setIsRepeatsOverlayOpen,
    setViewMode,
    setActiveFilter,
    setInfoReminder,
    onMarkAsDone,
    onMoveToTomorrow,
}: NotificationTapHandlerOptions) {
    useEffect(() => {
        let openTimer: number | null = null;

        const openTappedReminder = () => {
            const reminderId = localStorage.getItem(PENDING_NOTIFICATION_REMINDER_ID_KEY);
            if (!reminderId) return;

            const actionId = localStorage.getItem(PENDING_NOTIFICATION_ACTION_KEY);
            localStorage.removeItem(PENDING_NOTIFICATION_REMINDER_ID_KEY);
            localStorage.removeItem(PENDING_NOTIFICATION_ACTION_KEY);

            const tappedReminder = reminders.find((reminder) => reminder.id === reminderId);
            if (!tappedReminder) return;

            if (actionId === "mark-done") {
                onMarkAsDone(reminderId);
                return;
            }

            if (actionId === "move-tomorrow") {
                onMoveToTomorrow(reminderId);
                return;
            }

            setIsTutorialOpen(false);
            setIsOverlayOpen(false);
            setIsListsOverlayOpen(false);
            setIsRepeatsOverlayOpen(false);
            setActiveMainTab("reminders");
            setViewMode("list");
            setActiveFilter("all");

            if (openTimer !== null) {
                clearTimeout(openTimer);
            }
            openTimer = window.setTimeout(() => {
                setInfoReminder(tappedReminder);
            }, 300);
        };

        openTappedReminder();
        window.addEventListener(NOTIFICATION_TAP_EVENT, openTappedReminder);

        return () => {
            window.removeEventListener(NOTIFICATION_TAP_EVENT, openTappedReminder);
            if (openTimer !== null) {
                clearTimeout(openTimer);
            }
        };
    }, [
        reminders,
        setActiveMainTab,
        setActiveFilter,
        setInfoReminder,
        setIsListsOverlayOpen,
        setIsOverlayOpen,
        setIsRepeatsOverlayOpen,
        setIsTutorialOpen,
        setViewMode,
        onMarkAsDone,
        onMoveToTomorrow,
    ]);
}
