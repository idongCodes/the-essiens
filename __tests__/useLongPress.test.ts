import { renderHook, act } from '@testing-library/react';
import useLongPress from '@/hooks/useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('should trigger onClick when clicked quickly', () => {
    const onLongPress = jest.fn();
    const onClick = jest.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, onClick));

    const event = { target: {} } as any;

    act(() => {
      result.current.onMouseDown(event);
    });

    act(() => {
      // Release before 500ms
      jest.advanceTimersByTime(200);
      result.current.onMouseUp(event);
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should trigger onLongPress when held down', () => {
    const onLongPress = jest.fn();
    const onClick = jest.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, onClick));

    const event = { target: {} } as any;

    act(() => {
      result.current.onMouseDown(event);
    });

    act(() => {
      // Hold for 500ms
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();

    act(() => {
      result.current.onMouseUp(event);
    });

    // Should still not have called onClick
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should neither trigger click nor long press if mouse leaves before timeout', () => {
    const onLongPress = jest.fn();
    const onClick = jest.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, onClick));

    const event = { target: {} } as any;

    act(() => {
      result.current.onMouseDown(event);
    });

    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onMouseLeave(event);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
