import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AccountsProvider } from './context/AccountsContext';
import { BudgetProvider } from './context/BudgetContext';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AccountsProvider>
          <BudgetProvider>
            <AppRouter />
          </BudgetProvider>
        </AccountsProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
