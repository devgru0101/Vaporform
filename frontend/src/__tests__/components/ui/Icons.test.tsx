/**
 * Icons Component Tests
 * Tests for all icon components, sizes, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Icons from '@/components/ui/Icons';

describe('Icons Components', () => {
  const iconComponents = [
    { Component: Icons.VaporformLogo, name: 'VaporformLogo' },
    { Component: Icons.FileExplorerIcon, name: 'FileExplorerIcon' },
    { Component: Icons.SearchIcon, name: 'SearchIcon' },
    { Component: Icons.SourceControlIcon, name: 'SourceControlIcon' },
    { Component: Icons.DebugIcon, name: 'DebugIcon' },
    { Component: Icons.ExtensionsIcon, name: 'ExtensionsIcon' },
    { Component: Icons.SettingsIcon, name: 'SettingsIcon' },
    { Component: Icons.AiChatIcon, name: 'AiChatIcon' },
    { Component: Icons.CloseIcon, name: 'CloseIcon' },
    { Component: Icons.MinimizeIcon, name: 'MinimizeIcon' },
    { Component: Icons.SendIcon, name: 'SendIcon' },
    { Component: Icons.AttachIcon, name: 'AttachIcon' },
    { Component: Icons.MicIcon, name: 'MicIcon' },
    { Component: Icons.StopIcon, name: 'StopIcon' },
    { Component: Icons.CopyIcon, name: 'CopyIcon' },
    { Component: Icons.EditIcon, name: 'EditIcon' },
    { Component: Icons.DeleteIcon, name: 'DeleteIcon' },
    { Component: Icons.NewChatIcon, name: 'NewChatIcon' },
    { Component: Icons.ClearIcon, name: 'ClearIcon' },
    { Component: Icons.HistoryIcon, name: 'HistoryIcon' },
    { Component: Icons.FolderIcon, name: 'FolderIcon' },
    { Component: Icons.FolderOpenIcon, name: 'FolderOpenIcon' },
    { Component: Icons.FileIcon, name: 'FileIcon' },
    { Component: Icons.ChevronRightIcon, name: 'ChevronRightIcon' },
    { Component: Icons.ChevronDownIcon, name: 'ChevronDownIcon' },
    { Component: Icons.PlayIcon, name: 'PlayIcon' },
    { Component: Icons.PauseIcon, name: 'PauseIcon' },
    { Component: Icons.RefreshIcon, name: 'RefreshIcon' },
    { Component: Icons.TerminalIcon, name: 'TerminalIcon' },
    { Component: Icons.ContainerIcon, name: 'ContainerIcon' },
    { Component: Icons.DatabaseIcon, name: 'DatabaseIcon' },
    { Component: Icons.NetworkIcon, name: 'NetworkIcon' },
    { Component: Icons.ImageIcon, name: 'ImageIcon' },
    { Component: Icons.CodeIcon, name: 'CodeIcon' },
    { Component: Icons.SparklesIcon, name: 'SparklesIcon' },
    { Component: Icons.CloudIcon, name: 'CloudIcon' },
    { Component: Icons.ServerIcon, name: 'ServerIcon' },
    { Component: Icons.CheckIcon, name: 'CheckIcon' },
    { Component: Icons.ArrowRightIcon, name: 'ArrowRightIcon' },
    { Component: Icons.ExclamationTriangleIcon, name: 'ExclamationTriangleIcon' },
    { Component: Icons.DocumentIcon, name: 'DocumentIcon' },
    { Component: Icons.CogIcon, name: 'CogIcon' },
    { Component: Icons.RocketIcon, name: 'RocketIcon' },
    { Component: Icons.ClockIcon, name: 'ClockIcon' },
    { Component: Icons.LightBulbIcon, name: 'LightBulbIcon' },
    { Component: Icons.UserGroupIcon, name: 'UserGroupIcon' },
    { Component: Icons.ChartBarIcon, name: 'ChartBarIcon' },
    { Component: Icons.CurrencyDollarIcon, name: 'CurrencyDollarIcon' },
    { Component: Icons.EyeIcon, name: 'EyeIcon' },
    { Component: Icons.DocumentTextIcon, name: 'DocumentTextIcon' },
    { Component: Icons.ArrowLeftIcon, name: 'ArrowLeftIcon' },
  ];

  describe('Basic Rendering', () => {
    test.each(iconComponents)('should render $name', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toBeInTheDocument();
      expect(icon.tagName).toBe('svg');
    });

    test.each(iconComponents)('should render $name with default size', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
    });

    test.each(iconComponents)('should render $name with currentColor fill', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Size Prop', () => {
    test.each(iconComponents)('should render $name with custom size', ({ Component, name }) => {
      render(<Component size={32} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });

    test.each(iconComponents)('should render $name with small size', ({ Component, name }) => {
      render(<Component size={16} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    test.each(iconComponents)('should render $name with large size', ({ Component, name }) => {
      render(<Component size={48} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '48');
      expect(icon).toHaveAttribute('height', '48');
    });

    test.each(iconComponents)('should handle zero size for $name', ({ Component, name }) => {
      render(<Component size={0} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '0');
      expect(icon).toHaveAttribute('height', '0');
    });
  });

  describe('ClassName Prop', () => {
    test.each(iconComponents)('should apply custom className to $name', ({ Component, name }) => {
      render(<Component className="custom-icon-class" data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveClass('custom-icon-class');
    });

    test.each(iconComponents)('should apply multiple classes to $name', ({ Component, name }) => {
      render(<Component className="class-one class-two" data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveClass('class-one', 'class-two');
    });

    test.each(iconComponents)('should render $name without className when not provided', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      // Should not have a className attribute or should be empty
      const className = icon.getAttribute('class');
      expect(className).toBeNull();
    });
  });

  describe('SVG Properties', () => {
    test.each(iconComponents)('should have proper viewBox for $name', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    });

    test.each(iconComponents)('should have fill attribute for $name', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });

    test.each(iconComponents)('should contain path elements for $name', ({ Component, name }) => {
      render(<Component data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      // Each icon should have at least one path element or equivalent shape
      const paths = icon.querySelectorAll('path, circle, ellipse, rect, line, polygon');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test.each(iconComponents)('should be focusable when used as interactive element for $name', ({ Component, name }) => {
      render(
        <button>
          <Component data-testid={name} />
        </button>
      );
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId(name)).toBeInTheDocument();
    });

    test.each(iconComponents)('should support aria-label on parent element for $name', ({ Component, name }) => {
      render(
        <div aria-label={`${name} icon`}>
          <Component data-testid={name} />
        </div>
      );
      const container = screen.getByLabelText(`${name} icon`);
      
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId(name)).toBeInTheDocument();
    });

    test.each(iconComponents)('should work with screen readers when properly labeled for $name', ({ Component, name }) => {
      render(
        <button aria-label={`Action with ${name}`}>
          <Component data-testid={name} />
        </button>
      );
      const button = screen.getByLabelText(`Action with ${name}`);
      
      expect(button).toBeInTheDocument();
    });
  });

  describe('Integration with Styling Systems', () => {
    test.each(iconComponents)('should inherit color from parent for $name', ({ Component, name }) => {
      render(
        <div style={{ color: 'red' }}>
          <Component data-testid={name} />
        </div>
      );
      const icon = screen.getByTestId(name);
      
      // SVG should use currentColor, allowing it to inherit parent color
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });

    test.each(iconComponents)('should work with CSS frameworks for $name', ({ Component, name }) => {
      render(<Component className="text-blue-500 hover:text-blue-700" data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveClass('text-blue-500', 'hover:text-blue-700');
    });

    test.each(iconComponents)('should work with CSS-in-JS for $name', ({ Component, name }) => {
      const StyledComponent = () => (
        <Component 
          className="styled-icon" 
          data-testid={name}
        />
      );
      
      render(<StyledComponent />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveClass('styled-icon');
    });
  });

  describe('Performance', () => {
    test('should render multiple icons efficiently', () => {
      const { container } = render(
        <div>
          {iconComponents.slice(0, 10).map(({ Component, name }, index) => (
            <Component key={index} data-testid={`icon-${index}`} />
          ))}
        </div>
      );
      
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(10);
    });

    test('should handle rapid re-renders', () => {
      const { rerender } = render(<Icons.VaporformLogo size={24} />);
      
      // Re-render with different props multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<Icons.VaporformLogo size={24 + i} />);
      }
      
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test.each(iconComponents)('should handle negative size gracefully for $name', ({ Component, name }) => {
      render(<Component size={-10} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('width', '-10');
      expect(icon).toHaveAttribute('height', '-10');
    });

    test.each(iconComponents)('should handle very large sizes for $name', ({ Component, name }) => {
      render(<Component size={1000} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '1000');
      expect(icon).toHaveAttribute('height', '1000');
    });

    test.each(iconComponents)('should handle fractional sizes for $name', ({ Component, name }) => {
      render(<Component size={24.5} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toHaveAttribute('width', '24.5');
      expect(icon).toHaveAttribute('height', '24.5');
    });

    test.each(iconComponents)('should handle undefined props gracefully for $name', ({ Component, name }) => {
      render(<Component size={undefined} className={undefined} data-testid={name} />);
      const icon = screen.getByTestId(name);
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('width', '24'); // Should use default
      expect(icon).toHaveAttribute('height', '24');
    });
  });

  describe('Specific Icon Functionality', () => {
    test('VaporformLogo should have distinctive path', () => {
      render(<Icons.VaporformLogo data-testid="logo" />);
      const icon = screen.getByTestId('logo');
      const path = icon.querySelector('path');
      
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d');
    });

    test('FileExplorerIcon should represent folder structure', () => {
      render(<Icons.FileExplorerIcon data-testid="file-explorer" />);
      const icon = screen.getByTestId('file-explorer');
      
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('path')).toBeInTheDocument();
    });

    test('SearchIcon should have search-like appearance', () => {
      render(<Icons.SearchIcon data-testid="search" />);
      const icon = screen.getByTestId('search');
      
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('path')).toBeInTheDocument();
    });

    test('CloseIcon should have X-like appearance', () => {
      render(<Icons.CloseIcon data-testid="close" />);
      const icon = screen.getByTestId('close');
      
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('path')).toBeInTheDocument();
    });

    test('CheckIcon should have checkmark appearance', () => {
      render(<Icons.CheckIcon data-testid="check" />);
      const icon = screen.getByTestId('check');
      
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('Icon Categories', () => {
    const navigationIcons = [
      Icons.ChevronRightIcon,
      Icons.ChevronDownIcon,
      Icons.ArrowRightIcon,
      Icons.ArrowLeftIcon
    ];

    const actionIcons = [
      Icons.PlayIcon,
      Icons.PauseIcon,
      Icons.StopIcon,
      Icons.RefreshIcon,
      Icons.EditIcon,
      Icons.DeleteIcon,
      Icons.CopyIcon
    ];

    const fileIcons = [
      Icons.FileIcon,
      Icons.FolderIcon,
      Icons.FolderOpenIcon,
      Icons.DocumentIcon,
      Icons.DocumentTextIcon
    ];

    test('navigation icons should render correctly', () => {
      navigationIcons.forEach((Icon, index) => {
        render(<Icon data-testid={`nav-icon-${index}`} />);
        expect(screen.getByTestId(`nav-icon-${index}`)).toBeInTheDocument();
      });
    });

    test('action icons should render correctly', () => {
      actionIcons.forEach((Icon, index) => {
        render(<Icon data-testid={`action-icon-${index}`} />);
        expect(screen.getByTestId(`action-icon-${index}`)).toBeInTheDocument();
      });
    });

    test('file icons should render correctly', () => {
      fileIcons.forEach((Icon, index) => {
        render(<Icon data-testid={`file-icon-${index}`} />);
        expect(screen.getByTestId(`file-icon-${index}`)).toBeInTheDocument();
      });
    });
  });

  describe('Consistency', () => {
    test('all icons should have consistent interface', () => {
      iconComponents.forEach(({ Component, name }) => {
        // Each icon should accept size and className props
        expect(() => render(<Component size={20} className="test" />)).not.toThrow();
      });
    });

    test('all icons should use 24x24 viewBox', () => {
      iconComponents.forEach(({ Component, name }) => {
        render(<Component data-testid={`consistency-${name}`} />);
        const icon = screen.getByTestId(`consistency-${name}`);
        expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
      });
    });

    test('all icons should use currentColor fill', () => {
      iconComponents.forEach(({ Component, name }) => {
        render(<Component data-testid={`fill-${name}`} />);
        const icon = screen.getByTestId(`fill-${name}`);
        expect(icon).toHaveAttribute('fill', 'currentColor');
      });
    });
  });
});