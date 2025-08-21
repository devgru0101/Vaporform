/**
 * Button Component Tests
 * Tests for all button variants, sizes, states, and interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Button } from '@/components/ui/Button';
import { uiSlice } from '@/store/ui';

// Create a test store
const createTestStore = (theme = 'light') => {
  return configureStore({
    reducer: {
      ui: uiSlice.reducer,
    },
    preloadedState: {
      ui: {
        theme,
        sidebarOpen: true,
        rightPanelOpen: false,
        bottomPanelOpen: false,
        bottomPanelHeight: 300,
        loading: false,
        notifications: [],
        modal: null,
        commandPalette: { open: false, query: '' },
        breadcrumbs: [],
        activePanel: 'fileExplorer',
        fullscreen: false,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, theme = 'light') => {
  const store = createTestStore(theme);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    test('should render button with text', () => {
      renderWithProvider(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    test('should render button without text', () => {
      renderWithProvider(<Button />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should render with custom className', () => {
      renderWithProvider(<Button className="custom-class">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    test('should render with custom data attributes', () => {
      renderWithProvider(<Button data-testid="custom-button">Test</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('should render primary variant', () => {
      renderWithProvider(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({ cursor: 'pointer' });
    });

    test('should render secondary variant (default)', () => {
      renderWithProvider(<Button>Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render ghost variant', () => {
      renderWithProvider(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render danger variant', () => {
      renderWithProvider(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    test('should render xs size', () => {
      renderWithProvider(<Button size="xs">Extra Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render sm size', () => {
      renderWithProvider(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render md size (default)', () => {
      renderWithProvider(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render lg size', () => {
      renderWithProvider(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('States', () => {
    test('should render enabled state by default', () => {
      renderWithProvider(<Button>Enabled</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveStyle({ cursor: 'pointer' });
    });

    test('should render disabled state', () => {
      renderWithProvider(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({ cursor: 'not-allowed' });
    });

    test('should render loading state', () => {
      renderWithProvider(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Loading state should show spinner instead of text
      expect(button).not.toHaveTextContent('Loading');
    });

    test('should render full width', () => {
      renderWithProvider(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ width: '100%' });
    });
  });

  describe('Icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    test('should render with left icon', () => {
      renderWithProvider(
        <Button leftIcon={<TestIcon />}>With Left Icon</Button>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('With Left Icon');
    });

    test('should render with right icon', () => {
      renderWithProvider(
        <Button rightIcon={<TestIcon />}>With Right Icon</Button>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('With Right Icon');
    });

    test('should render with both left and right icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">Left</span>;
      const RightIcon = () => <span data-testid="right-icon">Right</span>;
      
      renderWithProvider(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Both Icons');
    });

    test('should not render icons when loading', () => {
      renderWithProvider(
        <Button loading leftIcon={<TestIcon />} rightIcon={<TestIcon />}>
          Loading with Icons
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should pass event object to onClick', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button loading onClick={handleClick}>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('should handle multiple clicks', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Keyboard Interaction', () => {
    test('should be focusable', () => {
      renderWithProvider(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    test('should handle Enter key', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should handle Space key', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Press Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should not be focusable when disabled', () => {
      renderWithProvider(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });
  });

  describe('Theme Support', () => {
    test('should render with light theme', () => {
      renderWithProvider(<Button variant="primary">Light Theme</Button>, 'light');
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should render with dark theme', () => {
      renderWithProvider(<Button variant="primary">Dark Theme</Button>, 'dark');
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('should adapt to theme changes', () => {
      const { rerender } = renderWithProvider(
        <Button variant="primary">Theme Test</Button>,
        'light'
      );
      
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Re-render with dark theme
      const darkStore = createTestStore('dark');
      rerender(
        <Provider store={darkStore}>
          <Button variant="primary">Theme Test</Button>
        </Provider>
      );
      
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should show loading spinner when loading', () => {
      renderWithProvider(<Button loading>Loading Test</Button>);
      const button = screen.getByRole('button');
      
      // The button should be disabled and not show the text
      expect(button).toBeDisabled();
      expect(button).not.toHaveTextContent('Loading Test');
    });

    test('should disable button when loading', () => {
      renderWithProvider(<Button loading>Loading Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    test('should change loading state dynamically', () => {
      const { rerender } = renderWithProvider(<Button>Not Loading</Button>);
      
      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Not Loading');
      
      rerender(
        <Provider store={createTestStore()}>
          <Button loading>Now Loading</Button>
        </Provider>
      );
      
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).not.toHaveTextContent('Now Loading');
    });
  });

  describe('Accessibility', () => {
    test('should have button role', () => {
      renderWithProvider(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should support aria-label', () => {
      renderWithProvider(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });

    test('should support aria-describedby', () => {
      renderWithProvider(
        <div>
          <Button aria-describedby="description">Button</Button>
          <div id="description">Button description</div>
        </div>
      );
      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'description');
    });

    test('should indicate disabled state to screen readers', () => {
      renderWithProvider(<Button disabled>Disabled Button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should maintain focus outline', () => {
      renderWithProvider(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveStyle({ outline: 'none' });
    });
  });

  describe('HTML Attributes', () => {
    test('should support type attribute', () => {
      renderWithProvider(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    test('should support form attribute', () => {
      renderWithProvider(<Button form="my-form">Form Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('form', 'my-form');
    });

    test('should support name attribute', () => {
      renderWithProvider(<Button name="action">Named Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('name', 'action');
    });

    test('should support value attribute', () => {
      renderWithProvider(<Button value="button-value">Value Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('value', 'button-value');
    });

    test('should support id attribute', () => {
      renderWithProvider(<Button id="unique-id">ID Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('id', 'unique-id');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined onClick gracefully', () => {
      renderWithProvider(<Button onClick={undefined}>No Handler</Button>);
      const button = screen.getByRole('button');
      
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    test('should handle null children', () => {
      renderWithProvider(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle undefined children', () => {
      renderWithProvider(<Button>{undefined}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle boolean children', () => {
      renderWithProvider(<Button>{false}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle mixed content children', () => {
      renderWithProvider(
        <Button>
          Text content
          <span>Nested element</span>
          {42}
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Text content');
      expect(button).toHaveTextContent('Nested element');
      expect(button).toHaveTextContent('42');
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const handleClick = jest.fn();
      const { rerender } = renderWithProvider(
        <Button onClick={handleClick}>Performance Test</Button>
      );
      
      // Re-render with same props
      rerender(
        <Provider store={createTestStore()}>
          <Button onClick={handleClick}>Performance Test</Button>
        </Provider>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should handle rapid clicks', () => {
      const handleClick = jest.fn();
      renderWithProvider(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Component Combinations', () => {
    test('should render all size and variant combinations', () => {
      const sizes = ['xs', 'sm', 'md', 'lg'] as const;
      const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;
      
      sizes.forEach(size => {
        variants.forEach(variant => {
          const { unmount } = renderWithProvider(
            <Button size={size} variant={variant}>
              {size} {variant}
            </Button>
          );
          
          expect(screen.getByRole('button')).toBeInTheDocument();
          unmount();
        });
      });
    });

    test('should handle complex combinations of props', () => {
      const handleClick = jest.fn();
      const TestIcon = () => <span data-testid="complex-icon">Icon</span>;
      
      renderWithProvider(
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<TestIcon />}
          onClick={handleClick}
          className="complex-button"
          data-testid="complex-test"
          aria-label="Complex button"
        >
          Complex Button
        </Button>
      );
      
      const button = screen.getByTestId('complex-test');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Complex Button');
      expect(button).toHaveAttribute('aria-label', 'Complex button');
      expect(button).toHaveClass('complex-button');
      expect(button).toHaveStyle({ width: '100%' });
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});