import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createNodeInteractionState,
	toggleExpanded,
	showMoreLinks,
	handleKeyboardInteraction,
	handleWheelScroll,
	getDisplayedLinks,
	type NodeInteractionState
} from './nodeInteraction';

describe('nodeInteraction', () => {
	let state: NodeInteractionState;

	beforeEach(() => {
		state = createNodeInteractionState();
	});

	describe('createNodeInteractionState', () => {
		it('should create initial state with correct defaults', () => {
			const newState = createNodeInteractionState();

			expect(newState.isExpanded).toBe(true);
			expect(newState.showAllLinks).toBe(false);
			expect(newState.linksToShow).toBe(10);
		});
	});

	describe('toggleExpanded', () => {
		it('should toggle isExpanded from true to false', () => {
			state.isExpanded = true;
			state.showAllLinks = true; // Set this to test reset behavior

			toggleExpanded(state);

			expect(state.isExpanded).toBe(false);
			expect(state.showAllLinks).toBe(false); // Should reset when collapsing
		});

		it('should toggle isExpanded from false to true', () => {
			state.isExpanded = false;

			toggleExpanded(state);

			expect(state.isExpanded).toBe(true);
		});

		it('should reset showAllLinks when collapsing', () => {
			state.isExpanded = true;
			state.showAllLinks = true;

			toggleExpanded(state); // This should collapse and reset

			expect(state.isExpanded).toBe(false);
			expect(state.showAllLinks).toBe(false);
		});

		it('should not affect showAllLinks when expanding', () => {
			state.isExpanded = false;
			state.showAllLinks = false;

			toggleExpanded(state); // This should expand

			expect(state.isExpanded).toBe(true);
			expect(state.showAllLinks).toBe(false); // Should remain unchanged
		});
	});

	describe('showMoreLinks', () => {
		it('should set showAllLinks to true', () => {
			state.showAllLinks = false;

			showMoreLinks(state);

			expect(state.showAllLinks).toBe(true);
		});

		it('should work when showAllLinks is already true', () => {
			state.showAllLinks = true;

			showMoreLinks(state);

			expect(state.showAllLinks).toBe(true);
		});
	});

	describe('handleKeyboardInteraction', () => {
		let mockOnSelect: () => void;

		beforeEach(() => {
			mockOnSelect = vi.fn();
		});

		it('should call onSelect and preventDefault for Enter key', () => {
			const mockEvent = {
				key: 'Enter',
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleKeyboardInteraction(mockEvent, mockOnSelect);

			expect(mockOnSelect).toHaveBeenCalled();
			expect(mockEvent.preventDefault).toHaveBeenCalled();
		});

		it('should call onSelect and preventDefault for Space key', () => {
			const mockEvent = {
				key: ' ',
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleKeyboardInteraction(mockEvent, mockOnSelect);

			expect(mockOnSelect).toHaveBeenCalled();
			expect(mockEvent.preventDefault).toHaveBeenCalled();
		});

		it('should not call onSelect for other keys', () => {
			const mockEvent = {
				key: 'Escape',
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleKeyboardInteraction(mockEvent, mockOnSelect);

			expect(mockOnSelect).not.toHaveBeenCalled();
			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		});

		it('should handle Tab key without triggering onSelect', () => {
			const mockEvent = {
				key: 'Tab',
				preventDefault: vi.fn()
			} as unknown as KeyboardEvent;

			handleKeyboardInteraction(mockEvent, mockOnSelect);

			expect(mockOnSelect).not.toHaveBeenCalled();
			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
		});

		it('should handle Arrow keys without triggering onSelect', () => {
			const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

			keys.forEach((key) => {
				const mockEvent = {
					key,
					preventDefault: vi.fn()
				} as unknown as KeyboardEvent;

				handleKeyboardInteraction(mockEvent, mockOnSelect);

				expect(mockOnSelect).not.toHaveBeenCalled();
				expect(mockEvent.preventDefault).not.toHaveBeenCalled();
			});
		});
	});

	describe('handleWheelScroll', () => {
		let mockLinksGrid: HTMLElement;

		beforeEach(() => {
			mockLinksGrid = {
				scrollTop: 0
			} as HTMLElement;
		});

		it('should stop propagation of wheel event', () => {
			const mockEvent = {
				deltaY: 100,
				stopPropagation: vi.fn(),
				currentTarget: mockLinksGrid
			} as unknown as WheelEvent;

			handleWheelScroll(mockEvent);

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
		});

		it('should update scrollTop based on deltaY', () => {
			const mockEvent = {
				deltaY: 100,
				stopPropagation: vi.fn(),
				currentTarget: mockLinksGrid
			} as unknown as WheelEvent;

			handleWheelScroll(mockEvent);

			expect(mockLinksGrid.scrollTop).toBe(100);
		});

		it('should handle negative deltaY (scroll up)', () => {
			mockLinksGrid.scrollTop = 200;

			const mockEvent = {
				deltaY: -50,
				stopPropagation: vi.fn(),
				currentTarget: mockLinksGrid
			} as unknown as WheelEvent;

			handleWheelScroll(mockEvent);

			expect(mockLinksGrid.scrollTop).toBe(150); // 200 + (-50)
		});

		it('should handle multiple scroll events', () => {
			const mockEvent1 = {
				deltaY: 30,
				stopPropagation: vi.fn(),
				currentTarget: mockLinksGrid
			} as unknown as WheelEvent;

			const mockEvent2 = {
				deltaY: 20,
				stopPropagation: vi.fn(),
				currentTarget: mockLinksGrid
			} as unknown as WheelEvent;

			handleWheelScroll(mockEvent1);
			expect(mockLinksGrid.scrollTop).toBe(30);

			handleWheelScroll(mockEvent2);
			expect(mockLinksGrid.scrollTop).toBe(50); // 30 + 20
		});
	});

	describe('getDisplayedLinks', () => {
		const testLinks = [
			'https://link1.com',
			'https://link2.com',
			'https://link3.com',
			'https://link4.com',
			'https://link5.com',
			'https://link6.com',
			'https://link7.com',
			'https://link8.com',
			'https://link9.com',
			'https://link10.com',
			'https://link11.com',
			'https://link12.com'
		];

		it('should return empty array when regularLinks is undefined', () => {
			const result = getDisplayedLinks(undefined, false, 10);
			expect(result).toEqual([]);
		});

		it('should return empty array when regularLinks is null', () => {
			const result = getDisplayedLinks(null as any, false, 10);
			expect(result).toEqual([]);
		});

		it('should return all links when showAllLinks is true', () => {
			const result = getDisplayedLinks(testLinks, true, 5);
			expect(result).toEqual(testLinks);
			expect(result).toHaveLength(12);
		});

		it('should return limited links when showAllLinks is false', () => {
			const result = getDisplayedLinks(testLinks, false, 5);
			expect(result).toEqual(testLinks.slice(0, 5));
			expect(result).toHaveLength(5);
		});

		it('should handle linksToShow greater than array length', () => {
			const result = getDisplayedLinks(testLinks, false, 20);
			expect(result).toEqual(testLinks);
			expect(result).toHaveLength(12);
		});

		it('should handle linksToShow of 0', () => {
			const result = getDisplayedLinks(testLinks, false, 0);
			expect(result).toEqual([]);
		});

		it('should handle negative linksToShow', () => {
			const result = getDisplayedLinks(testLinks, false, -5);
			// slice(0, -5) returns all items except the last 5, so we get the first 2 items
			expect(result).toEqual(testLinks.slice(0, -5));
		});

		it('should return first link when linksToShow is 1', () => {
			const result = getDisplayedLinks(testLinks, false, 1);
			expect(result).toEqual(['https://link1.com']);
		});

		it('should handle empty regularLinks array', () => {
			const result = getDisplayedLinks([], false, 10);
			expect(result).toEqual([]);
		});

		it('should maintain order of links', () => {
			const result = getDisplayedLinks(testLinks, false, 3);
			expect(result).toEqual(['https://link1.com', 'https://link2.com', 'https://link3.com']);
		});
	});
});
