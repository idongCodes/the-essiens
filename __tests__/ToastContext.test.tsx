import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '@/context/ToastContext';

// A test component to trigger toasts
const ToastTestComponent = () => {
  const { success, error, showToast } = useToast();

  return (
    <div>
      <button onClick={() => success('Success message')}>Success</button>
      <button onClick={() => error('Error message')}>Error</button>
      <button onClick={() => showToast('Custom info message', 'info', 0)}>Custom</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('should render a success toast', () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success'));
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render an error toast', () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Error'));
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should automatically remove toasts after their duration', () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    act(() => {
      // Default duration is 4000ms
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should not automatically remove toasts if duration is 0', () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Custom'));
    expect(screen.getByText('Custom info message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should still be there
    expect(screen.getByText('Custom info message')).toBeInTheDocument();
  });
});
