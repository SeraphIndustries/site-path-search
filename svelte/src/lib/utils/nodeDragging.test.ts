import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createDragState,
	startDrag,
	updateDragPosition,
	endDrag,
	setupGlobalDragListeners,
	type DragState
} from './nodeDragging';

describe('nodeDragging', () => {
	let dragState: DragState;

	beforeEach(() => {
		dragState = createDragState();
	});

	describe('createDragState', () => {
		it('should create initial drag state with correct defaults', () => {
			const state = createDragState();

			expect(state.isDragging).toBe(false);
			expect(state.dragStart).toEqual({ x: 0, y: 0 });
		});
	});

	describe('startDrag', () => {
		let mockEvent: MouseEvent;
		let nodePosition: { x: number; y: number };

		beforeEach(() => {
			nodePosition = { x: 100, y: 200 };
			mockEvent = {
				target: {
					classList: { contains: vi.fn().mockReturnValue(false) },
					closest: vi.fn().mockReturnValue(null)
				},
				clientX: 250,
				clientY: 350,
				stopPropagation: vi.fn()
			} as unknown as MouseEvent;
		});

		it('should start dragging when clicking on allowed areas', () => {
			const result = startDrag(mockEvent, nodePosition, dragState);

			expect(result).toBe(true);
			expect(dragState.isDragging).toBe(true);
			expect(dragState.dragStart).toEqual({
				x: 250 - 100, // clientX - nodePosition.x
				y: 350 - 200 // clientY - nodePosition.y
			});
			expect(mockEvent.stopPropagation).toHaveBeenCalled();
		});

		it('should not start dragging when clicking on expand button', () => {
			const expandButton = {
				className: 'expand-button',
				closest: vi.fn((selector) => (selector === '.expand-button' ? expandButton : null))
			};
			const target = {
				appendChild: vi.fn()
			};
			target.appendChild(expandButton);

			mockEvent = {
				...mockEvent,
				target: expandButton
			} as unknown as MouseEvent;

			const result = startDrag(mockEvent, nodePosition, dragState);

			expect(result).toBe(false);
			expect(dragState.isDragging).toBe(false);
		});

		it('should not start dragging when clicking on link button', () => {
			const linkButton = {
				className: 'link-button',
				closest: vi.fn((selector) => (selector === '.link-button' ? linkButton : null))
			};

			mockEvent = {
				...mockEvent,
				target: linkButton
			} as unknown as MouseEvent;

			const result = startDrag(mockEvent, nodePosition, dragState);

			expect(result).toBe(false);
			expect(dragState.isDragging).toBe(false);
		});

		it('should not start dragging when clicking on more-links element', () => {
			const moreLinks = {
				className: 'more-links',
				closest: vi.fn((selector) => (selector === '.more-links' ? moreLinks : null))
			};

			mockEvent = {
				...mockEvent,
				target: moreLinks
			} as unknown as MouseEvent;

			const result = startDrag(mockEvent, nodePosition, dragState);

			expect(result).toBe(false);
			expect(dragState.isDragging).toBe(false);
		});

		it('should calculate drag start offset correctly', () => {
			mockEvent.clientX = 500;
			mockEvent.clientY = 600;
			nodePosition = { x: 150, y: 250 };

			startDrag(mockEvent, nodePosition, dragState);

			expect(dragState.dragStart).toEqual({
				x: 500 - 150, // 350
				y: 600 - 250 // 350
			});
		});
	});

	describe('updateDragPosition', () => {
		beforeEach(() => {
			dragState.isDragging = true;
			dragState.dragStart = { x: 50, y: 75 };
		});

		it('should return new position when dragging', () => {
			const mockEvent = {
				clientX: 300,
				clientY: 400
			} as MouseEvent;

			const result = updateDragPosition(mockEvent, dragState);

			expect(result).toEqual({
				x: 300 - 50, // 250
				y: 400 - 75 // 325
			});
		});

		it('should return null when not dragging', () => {
			dragState.isDragging = false;

			const mockEvent = {
				clientX: 300,
				clientY: 400
			} as MouseEvent;

			const result = updateDragPosition(mockEvent, dragState);

			expect(result).toBeNull();
		});

		it('should handle negative coordinates', () => {
			const mockEvent = {
				clientX: 25, // Less than dragStart.x
				clientY: 50 // Less than dragStart.y
			} as MouseEvent;

			const result = updateDragPosition(mockEvent, dragState);

			expect(result).toEqual({
				x: 25 - 50, // -25
				y: 50 - 75 // -25
			});
		});
	});

	describe('endDrag', () => {
		it('should stop dragging', () => {
			dragState.isDragging = true;

			endDrag(dragState);

			expect(dragState.isDragging).toBe(false);
		});

		it('should work when already not dragging', () => {
			dragState.isDragging = false;

			endDrag(dragState);

			expect(dragState.isDragging).toBe(false);
		});
	});

	describe('setupGlobalDragListeners', () => {
		let mockOnMouseMove: (event: MouseEvent) => void;
		let mockOnMouseUp: () => void;
		let mockWindow: any;

		beforeEach(() => {
			mockOnMouseMove = vi.fn();
			mockOnMouseUp = vi.fn();

			// Mock window with addEventListener/removeEventListener
			mockWindow = {
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			};

			// Mock global window
			vi.stubGlobal('window', mockWindow);
		});

		it('should set up global event listeners', () => {
			const cleanup = setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			expect(mockWindow.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
			expect(mockWindow.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
			expect(typeof cleanup).toBe('function');
		});

		it('should call onMouseMove when dragging and mouse moves', () => {
			dragState.isDragging = true;
			setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			// Get the registered mousemove handler
			const mouseMoveHandler = mockWindow.addEventListener.mock.calls.find(
				(call) => call[0] === 'mousemove'
			)[1];

			const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent;
			mouseMoveHandler(mockEvent);

			expect(mockOnMouseMove).toHaveBeenCalledWith(mockEvent);
		});

		it('should not call onMouseMove when not dragging', () => {
			dragState.isDragging = false;
			setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			const mouseMoveHandler = mockWindow.addEventListener.mock.calls.find(
				(call) => call[0] === 'mousemove'
			)[1];

			const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent;
			mouseMoveHandler(mockEvent);

			expect(mockOnMouseMove).not.toHaveBeenCalled();
		});

		it('should call onMouseUp and endDrag when mouse up and dragging', () => {
			dragState.isDragging = true;
			setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			const mouseUpHandler = mockWindow.addEventListener.mock.calls.find(
				(call) => call[0] === 'mouseup'
			)[1];

			mouseUpHandler();

			expect(mockOnMouseUp).toHaveBeenCalled();
			expect(dragState.isDragging).toBe(false);
		});

		it('should not call onMouseUp when not dragging', () => {
			dragState.isDragging = false;
			setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			const mouseUpHandler = mockWindow.addEventListener.mock.calls.find(
				(call) => call[0] === 'mouseup'
			)[1];

			mouseUpHandler();

			expect(mockOnMouseUp).not.toHaveBeenCalled();
		});

		it('should return cleanup function that removes event listeners', () => {
			const cleanup = setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			cleanup();

			expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
				'mousemove',
				expect.any(Function)
			);
			expect(mockWindow.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
		});

		it('should return no-op cleanup function when window is undefined (SSR)', () => {
			vi.stubGlobal('window', undefined);

			const cleanup = setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			expect(typeof cleanup).toBe('function');
			// Should not throw when called
			cleanup();
		});

		it('should handle multiple mouse events correctly', () => {
			dragState.isDragging = true;
			setupGlobalDragListeners(dragState, mockOnMouseMove, mockOnMouseUp);

			const mouseMoveHandler = mockWindow.addEventListener.mock.calls.find(
				(call) => call[0] === 'mousemove'
			)[1];

			// Simulate multiple mouse move events
			mouseMoveHandler({ clientX: 100, clientY: 200 } as MouseEvent);
			mouseMoveHandler({ clientX: 150, clientY: 250 } as MouseEvent);
			mouseMoveHandler({ clientX: 200, clientY: 300 } as MouseEvent);

			expect(mockOnMouseMove).toHaveBeenCalledTimes(3);
		});
	});
});
