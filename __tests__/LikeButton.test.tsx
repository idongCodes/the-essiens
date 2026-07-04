import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import LikeButton from '@/components/LikeButton';

describe('LikeButton Component', () => {
  const mockOnToggle = jest.fn().mockResolvedValue(undefined);
  const mockInitialLikes = [
    {
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        alias: 'Johnny',
      },
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnToggle.mockClear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders correctly with initial likes', () => {
    render(
      <LikeButton
        initialLikes={mockInitialLikes}
        currentUserId="user-2"
        onToggle={mockOnToggle}
      />
    );
    // Button should display '1' because there is one like
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    render(
      <LikeButton
        initialLikes={mockInitialLikes}
        currentUserId="user-2"
        onToggle={mockOnToggle}
      />
    );
    
    const button = screen.getByRole('button');
    
    act(() => {
      fireEvent.mouseDown(button);
    });

    act(() => {
      jest.advanceTimersByTime(100);
      fireEvent.mouseUp(button);
    });

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    
    // It should optimistically update to '2'
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows the popup list on long press', () => {
    render(
      <LikeButton
        initialLikes={mockInitialLikes}
        currentUserId="user-2"
        onToggle={mockOnToggle}
      />
    );
    
    const button = screen.getByRole('button');
    
    act(() => {
      fireEvent.mouseDown(button);
    });

    act(() => {
      // Long press delay is 500ms
      jest.advanceTimersByTime(500);
    });

    // The popup should now render, showing "Johnny"
    expect(screen.getByText('Johnny')).toBeInTheDocument();
    
    act(() => {
      fireEvent.mouseUp(button);
    });

    // Should NOT call onToggle because it was a long press, not a click
    expect(mockOnToggle).not.toHaveBeenCalled();
  });
});
