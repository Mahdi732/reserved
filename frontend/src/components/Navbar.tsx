'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link href="/" className="navbar-brand">
          EventReserve
        </Link>
        <div className="navbar-nav">
          <Link href="/events" className="navbar-link">
            Events
          </Link>
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="navbar-link">
                  Admin Dashboard
                </Link>
              )}
              {user.role === 'PARTICIPANT' && (
                <Link href="/dashboard" className="navbar-link">
                  My Reservations
                </Link>
              )}
              <div className="navbar-user">
                <span>Hello, {user.name}</span>
                <button onClick={logout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="navbar-link">
                Login
              </Link>
              <Link href="/register" className="navbar-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
