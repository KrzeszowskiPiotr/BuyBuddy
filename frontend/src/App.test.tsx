import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import React from 'react';

jest.mock('axios');
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('Komponent App - Testy Jednostkowe', () => {

  test('powinien wyświetlić ekran startowy z logo BuyBuddy', () => {
    render(<App />);

    const logoElement = screen.getByText(/BuyBuddy/i);
    expect(logoElement).toBeInTheDocument();

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  test('powinien przełączyć widok na logowanie po kliknięciu przycisku Login', () => {
    render(<App />);

    const loginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginButton);

    const loginHeader = screen.getByRole('heading', { level: 3, name: /Login/i });
    expect(loginHeader).toBeInTheDocument();
  });

  test('powinien przełączyć widok na rejestrację po kliknięciu przycisku Register', () => {
    render(<App />);

    const registerButton = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(registerButton);

    const registerHeader = screen.getByText(/Already have an account?/i);
    expect(registerHeader).toBeInTheDocument();
  });
});
