import { useCallback, useEffect, useState } from 'react';
import ChatService from '../../services/ChatService';

const STORAGE_KEY = 'inms-chat-history';
const CRITICAL_ALERT_STORAGE_KEY = 'inms-last-critical-alert';
const MAX_HISTORY_MESSAGES = 50;
const MIN_BOT_RESPONSE_DELAY_MS = 2000;

export const suggestedPrompts = [
  'How many total nodes are there?',
  'How many active nodes are there?',
  'How many down nodes are there?',
  'Show active alarms',
  'Show critical alarms',
  'What is the status of SLBN-Colombo-01?',
  'Show impacted devices for alarm 1',
  'Troubleshooting guide for NODE_DOWN',
  'Show critical alarms in Colombo',
  'Top recurring failed devices'
];

function normalizeMessages(messages) {
  return messages
    .filter(
      (message) =>
        message &&
        (message.type === 'user' || message.type === 'bot') &&
        typeof message.content === 'string' &&
        message.content.trim() !== ''
    )
    .slice(-MAX_HISTORY_MESSAGES);
}

function loadStoredMessages() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeMessages(parsed) : [];
  } catch {
    return [];
  }
}

function waitForMinimumResponseDelay(startedAt) {
  const elapsed = Date.now() - startedAt;
  const remainingDelay = MIN_BOT_RESPONSE_DELAY_MS - elapsed;

  if (remainingDelay <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, remainingDelay);
  });
}

export default function useChatSession() {
  const [messages, setMessages] = useState(() => loadStoredMessages());
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeMessages(messages)));
    } catch {
      // Ignore storage write failures and keep the chat usable.
    }
  }, [messages]);

  const sendMessage = async (messageOverride) => {
    const userMessage = (messageOverride ?? inputMessage).trim();

    if (!userMessage || isLoading) {
      return;
    }

    setInputMessage('');
    setIsLoading(true);

    const nextUserMessage = { type: 'user', content: userMessage };
    setMessages((currentMessages) => normalizeMessages([...currentMessages, nextUserMessage]));

    const requestStartedAt = Date.now();

    try {
      const response = await ChatService.sendMessage(userMessage);
      await waitForMinimumResponseDelay(requestStartedAt);

      const botMessage = {
        type: 'bot',
        content: response?.message?.trim() || "I couldn't generate a response right now."
      };

      setMessages((currentMessages) => normalizeMessages([...currentMessages, botMessage]));
    } catch {
      await waitForMinimumResponseDelay(requestStartedAt);

      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.'
      };

      setMessages((currentMessages) => normalizeMessages([...currentMessages, errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const checkForCriticalAlert = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const response = await ChatService.sendMessage('Show critical alarms');
      const criticalSummary = response?.message?.trim();
      if (!criticalSummary || /no active alarms on critical-priority devices/i.test(criticalSummary)) {
        return;
      }

      const alertKey = criticalSummary.slice(0, 220);
      if (window.localStorage.getItem(CRITICAL_ALERT_STORAGE_KEY) === alertKey) {
        return;
      }

      window.localStorage.setItem(CRITICAL_ALERT_STORAGE_KEY, alertKey);
      const alertMessage = {
        type: 'bot',
        content: `New critical alarm detected. Want a summary?\n\n${criticalSummary}`
      };
      setMessages((currentMessages) => normalizeMessages([...currentMessages, alertMessage]));
    } catch {
      // Keep proactive checks silent so normal chat remains usable.
    }
  }, []);

  const reloadHistory = useCallback(() => {
    setMessages(loadStoredMessages());
  }, []);

  return {
    messages,
    inputMessage,
    isLoading,
    setInputMessage,
    sendMessage,
    clearHistory,
    checkForCriticalAlert,
    reloadHistory,
    suggestedPrompts
  };
}
