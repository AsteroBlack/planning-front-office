'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '📊 Dashboard', icon: '🏠' },
    { href: '/employees', label: '👥 Employés', icon: '👥' },
    { href: '/settings', label: '⚙️ Configuration', icon: '⚙️' },
    { href: '/generate', label: '🎯 Générer Planning', icon: '🎯' },
  ];

  return (
    <nav className="w-64 bg-slate-900 h-screen fixed left-0 top-0 border-r border-slate-700">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white mb-8">
          Planning Front Office
        </h1>
        
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-colors
                  ${pathname === link.href 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-slate-400 text-center">
          Star Platinum Planning v1.0
        </div>
      </div>
    </nav>
  );
}