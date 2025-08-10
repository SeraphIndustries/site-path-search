import type { PathNode } from '$lib/types/linkAnalysis';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ZOOM_LIMITS,
	checkDarkMode,
	createCanvasState,
	handleCanvasKeyDown,
	handleCanvasMouseDown,
	handleCanvasMouseMove,
	handleCanvasMouseUp,
	handleCanvasWheel,
	initializeCanvasOffset,
	resetView,
	updateCanvasTransform,
	zoomIn,
	zoomOut,
	type CanvasState
} from './canvasOperations';

describe('canvasOperations', () => {
	let canvasState: CanvasState;
	let mockCanvasWrapper: HTMLDivElement;
	let mockCanvasContainer: HTMLDivElement;

	beforeEach(() => {
		canvasState = createCanvasState();

		// Mock DOM elements
		mockCanvasWrapper = {
			getBoundingClientRect: vi.fn(() => ({
				width: 800,
				height: 600,
				left: 0,
				top: 0,
				right: 800,
				bottom: 600
			}))
		} as unknown as HTMLDivElement;

		mockCanvasContainer = {
			style: { transform: '' }
		} as unknown as HTMLDivElement;
	});

	describe('createCanvasState', () => {
		it('should create initial canvas state with correct defaults', () => {
			const state = createCanvasState();

			expect(state.isDragging).toBe(false);
			expect(state.dragStart).toEqual({ x: 0, y: 0 });
			expect(state.canvasOffset).toEqual({ x: 0, y: 0 });
			expect(state.zoom).toBe(1);
			expect(state.isDark).toBe(false);
		});
	});

	describe('ZOOM_LIMITS', () => {
		it('should have correct zoom limits', () => {
			expect(ZOOM_LIMITS.min).toBe(0.3);
			expect(ZOOM_LIMITS.max).toBe(3);
		});
	});

	describe('initializeCanvasOffset', () => {
		it('should set canvas offset to center between start and end nodes', () => {
			const startNode: PathNode = {
				id: 'start',
				url: 'https://start.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 100, y: 200 },
				isStartNode: true,
				isEndNode: false,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};

			const endNode: PathNode = {
				id: 'end',
				url: 'https://end.com',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: 0,
				position: { x: 300, y: 400 },
				isStartNode: false,
				isEndNode: true,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};

			initializeCanvasOffset(mockCanvasWrapper, startNode, endNode, canvasState);

			const expectedCenterX = (100 + 300) / 2; // 200
			const expectedCenterY = (200 + 400) / 2; // 300
			const expectedOffsetX = 800 / 2 - expectedCenterX; // 400 - 200 = 200
			const expectedOffsetY = 600 / 2 - expectedCenterY; // 300 - 300 = 0

			expect(canvasState.canvasOffset.x).toBe(expectedOffsetX);
			expect(canvasState.canvasOffset.y).toBe(expectedOffsetY);
		});
	});

	describe('handleCanvasMouseDown', () => {
		it('should start dragging when clicking on canvas container', () => {
			const mockEvent = {
				target: mockCanvasContainer,
				clientX: 100,
				clientY: 150
			} as unknown as MouseEvent;

			handleCanvasMouseDown(mockEvent, mockCanvasContainer, mockCanvasWrapper, canvasState);

			expect(canvasState.isDragging).toBe(true);
			expect(canvasState.dragStart.x).toBe(100);
			expect(canvasState.dragStart.y).toBe(150);
		});

		it('should start dragging when clicking on canvas wrapper', () => {
			const mockEvent = {
				target: mockCanvasWrapper,
				clientX: 200,
				clientY: 250
			} as unknown as MouseEvent;

			handleCanvasMouseDown(mockEvent, mockCanvasContainer, mockCanvasWrapper, canvasState);

			expect(canvasState.isDragging).toBe(true);
			expect(canvasState.dragStart.x).toBe(200);
			expect(canvasState.dragStart.y).toBe(250);
		});

		it('should not start dragging when clicking on other elements', () => {
			const otherElement = { classList: { contains: vi.fn().mockReturnValue(false) } };
			const mockEvent = {
				target: otherElement,
				clientX: 100,
				clientY: 150
			} as unknown as MouseEvent;

			handleCanvasMouseDown(mockEvent, mockCanvasContainer, mockCanvasWrapper, canvasState);

			expect(canvasState.isDragging).toBe(false);
		});
	});

	describe('handleCanvasMouseMove', () => {
		it('should update canvas offset when dragging', () => {
			canvasState.isDragging = true;
			canvasState.dragStart = { x: 50, y: 75 };

			const mockEvent = {
				clientX: 200,
				clientY: 300
			} as MouseEvent;

			handleCanvasMouseMove(mockEvent, canvasState);

			expect(canvasState.canvasOffset.x).toBe(150); // 200 - 50
			expect(canvasState.canvasOffset.y).toBe(225); // 300 - 75
		});

		it('should not update canvas offset when not dragging', () => {
			canvasState.isDragging = false;
			const originalOffset = { ...canvasState.canvasOffset };

			const mockEvent = {
				clientX: 200,
				clientY: 300
			} as MouseEvent;

			handleCanvasMouseMove(mockEvent, canvasState);

			expect(canvasState.canvasOffset).toEqual(originalOffset);
		});
	});

	describe('handleCanvasMouseUp', () => {
		it('should stop dragging', () => {
			canvasState.isDragging = true;

			handleCanvasMouseUp(canvasState);

			expect(canvasState.isDragging).toBe(false);
		});
	});

	describe('handleCanvasKeyDown', () => {
		it('should move canvas with arrow keys', () => {
			const mockEvent = {
				key: 'ArrowRight',
				shiftKey: false,
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleCanvasKeyDown(mockEvent, canvasState);

			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(canvasState.canvasOffset.x).toBe(-20); // ArrowRight decreases x
		});

		it('should move canvas with larger steps when shift is held', () => {
			const mockEvent = {
				key: 'ArrowUp',
				shiftKey: true,
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleCanvasKeyDown(mockEvent, canvasState);

			expect(canvasState.canvasOffset.y).toBe(50); // ArrowUp increases y with shift
		});

		it('should handle all arrow keys correctly', () => {
			const testCases = [
				{ key: 'ArrowUp', expectedX: 0, expectedY: 20 },
				{ key: 'ArrowDown', expectedX: 0, expectedY: -20 },
				{ key: 'ArrowLeft', expectedX: 20, expectedY: 0 },
				{ key: 'ArrowRight', expectedX: -20, expectedY: 0 }
			];

			testCases.forEach(({ key, expectedX, expectedY }) => {
				const state = createCanvasState();
				const mockEvent = {
					key,
					shiftKey: false,
					preventDefault: vi.fn()
				} as unknown as KeyboardEvent;

				handleCanvasKeyDown(mockEvent, state);

				expect(state.canvasOffset.x).toBe(expectedX);
				expect(state.canvasOffset.y).toBe(expectedY);
			});
		});

		it('should not affect canvas offset for non-arrow keys', () => {
			const originalOffset = { ...canvasState.canvasOffset };
			const mockEvent = {
				key: 'Space',
				shiftKey: false,
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleCanvasKeyDown(mockEvent, canvasState);

			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
			expect(canvasState.canvasOffset).toEqual(originalOffset);
		});
	});

	describe('handleCanvasWheel', () => {
		it('should zoom in when scrolling up', () => {
			const mockEvent = {
				deltaY: -100,
				clientX: 400,
				clientY: 300,
				preventDefault: vi.fn()
			} as unknown as WheelEvent;

			const mockRect = {
				left: 0,
				top: 0,
				width: 800,
				height: 600
			};
			vi.mocked(mockCanvasWrapper.getBoundingClientRect).mockReturnValue(mockRect as DOMRect);

			handleCanvasWheel(mockEvent, mockCanvasWrapper, canvasState);

			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(canvasState.zoom).toBeGreaterThan(1);
		});

		it('should zoom out when scrolling down', () => {
			const mockEvent = {
				deltaY: 100,
				clientX: 400,
				clientY: 300,
				preventDefault: vi.fn()
			} as unknown as WheelEvent;

			const mockRect = {
				left: 0,
				top: 0,
				width: 800,
				height: 600
			};
			vi.mocked(mockCanvasWrapper.getBoundingClientRect).mockReturnValue(mockRect as DOMRect);

			handleCanvasWheel(mockEvent, mockCanvasWrapper, canvasState);

			expect(canvasState.zoom).toBeLessThan(1);
		});

		it('should respect zoom limits', () => {
			// Test max zoom limit
			canvasState.zoom = ZOOM_LIMITS.max;
			const zoomInEvent = {
				deltaY: -100,
				clientX: 400,
				clientY: 300,
				preventDefault: vi.fn()
			} as unknown as WheelEvent;

			const mockRect = { left: 0, top: 0, width: 800, height: 600 };
			vi.mocked(mockCanvasWrapper.getBoundingClientRect).mockReturnValue(mockRect as DOMRect);

			handleCanvasWheel(zoomInEvent, mockCanvasWrapper, canvasState);
			expect(canvasState.zoom).toBe(ZOOM_LIMITS.max);

			// Test min zoom limit
			canvasState.zoom = ZOOM_LIMITS.min;
			const zoomOutEvent = {
				deltaY: 100,
				clientX: 400,
				clientY: 300,
				preventDefault: vi.fn()
			} as unknown as WheelEvent;

			handleCanvasWheel(zoomOutEvent, mockCanvasWrapper, canvasState);
			expect(canvasState.zoom).toBe(ZOOM_LIMITS.min);
		});
	});

	describe('updateCanvasTransform', () => {
		it('should apply correct transform to canvas container', () => {
			canvasState.canvasOffset = { x: 100, y: 150 };
			canvasState.zoom = 1.5;

			updateCanvasTransform(mockCanvasContainer, canvasState);

			expect(mockCanvasContainer.style.transform).toBe('translate(100px, 150px) scale(1.5)');
		});
	});

	describe('zoomIn', () => {
		it('should increase zoom and return true', () => {
			const originalZoom = canvasState.zoom;
			const result = zoomIn(canvasState);

			expect(result).toBe(true);
			expect(canvasState.zoom).toBe(originalZoom * 1.2);
		});

		it('should not zoom beyond max limit', () => {
			canvasState.zoom = ZOOM_LIMITS.max;
			const result = zoomIn(canvasState);

			expect(result).toBe(false);
			expect(canvasState.zoom).toBe(ZOOM_LIMITS.max);
		});
	});

	describe('zoomOut', () => {
		it('should decrease zoom and return true', () => {
			canvasState.zoom = 2;
			const result = zoomOut(canvasState);

			expect(result).toBe(true);
			expect(canvasState.zoom).toBe(2 / 1.2);
		});

		it('should not zoom below min limit', () => {
			canvasState.zoom = ZOOM_LIMITS.min;
			const result = zoomOut(canvasState);

			expect(result).toBe(false);
			expect(canvasState.zoom).toBe(ZOOM_LIMITS.min);
		});
	});

	describe('resetView', () => {
		it('should reset zoom to 0.8', () => {
			canvasState.zoom = 2;
			const nodes: PathNode[] = [];
			const blankStartNode: PathNode = {
				id: 'blank-start',
				url: 'start',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 4800, y: 5000 },
				isStartNode: true,
				isEndNode: false,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};
			const blankEndNode: PathNode = {
				id: 'blank-end',
				url: 'end',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 5700, y: 5000 },
				isStartNode: false,
				isEndNode: true,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};

			resetView(nodes, blankStartNode, blankEndNode, mockCanvasWrapper, canvasState);

			expect(canvasState.zoom).toBe(0.8);
		});

		it('should center view on nodes when nodes exist', () => {
			const nodes: PathNode[] = [
				{
					id: 'node1',
					url: 'https://example.com',
					linkSummary: null,
					error: '',
					isLoading: false,
					level: 0,
					position: { x: 100, y: 200 },
					isStartNode: false,
					isEndNode: false,
					kagiSearchSummary: null,
					isKagiSearchNode: false
				},
				{
					id: 'node2',
					url: 'https://example2.com',
					linkSummary: null,
					error: '',
					isLoading: false,
					level: 1,
					position: { x: 300, y: 400 },
					isStartNode: false,
					isEndNode: false,
					kagiSearchSummary: null,
					isKagiSearchNode: false
				}
			];

			const blankStartNode: PathNode = {
				id: 'blank-start',
				url: 'start',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 4800, y: 5000 },
				isStartNode: true,
				isEndNode: false,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};
			const blankEndNode: PathNode = {
				id: 'blank-end',
				url: 'end',
				linkSummary: null,
				error: '',
				isLoading: false,
				level: -1,
				position: { x: 5700, y: 5000 },
				isStartNode: false,
				isEndNode: true,
				kagiSearchSummary: null,
				isKagiSearchNode: false
			};

			resetView(nodes, blankStartNode, blankEndNode, mockCanvasWrapper, canvasState);

			// Should center on the calculated center of all nodes including visible blank nodes
			// Since no nodes have isStartNode/isEndNode true, both blank nodes are visible
			// All nodes: (100,200), (300,400), (4800,5000), (5700,5000)
			const centerX = (100 + 5700) / 2; // 2900
			const centerY = (200 + 5000) / 2; // 2600
			const expectedOffsetX = 800 / 2 - centerX + 5000; // 400 - 2900 + 5000 = 2500
			const expectedOffsetY = 600 / 2 - centerY + 5000; // 300 - 2600 + 5000 = 2700

			expect(canvasState.canvasOffset.x).toBe(expectedOffsetX);
			expect(canvasState.canvasOffset.y).toBe(expectedOffsetY);
		});
	});

	describe('checkDarkMode', () => {
		it('should return true when main container has dark class', () => {
			// Mock document.querySelector
			const mockElement = {
				classList: {
					contains: vi.fn(() => true)
				}
			};
			vi.stubGlobal('document', {
				querySelector: vi.fn(() => mockElement)
			});

			const result = checkDarkMode();

			expect(result).toBe(true);
			expect(document.querySelector).toHaveBeenCalledWith('.main-container');
			expect(mockElement.classList.contains).toHaveBeenCalledWith('dark');
		});

		it('should return false when main container does not have dark class', () => {
			const mockElement = {
				classList: {
					contains: vi.fn(() => false)
				}
			};
			vi.stubGlobal('document', {
				querySelector: vi.fn(() => mockElement)
			});

			const result = checkDarkMode();

			expect(result).toBe(false);
		});

		it('should return false when main container is not found', () => {
			vi.stubGlobal('document', {
				querySelector: vi.fn(() => null)
			});

			const result = checkDarkMode();

			expect(result).toBe(false);
		});
	});
});
