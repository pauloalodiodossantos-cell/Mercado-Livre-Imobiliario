import { Link, useNavigate } from "react-router-dom";
import { Building2, LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const dashboardPath = user?.role === "SELLER" ? "/seller" : "/buyer";

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-brand-600 p-2 rounded-xl group-hover:bg-brand-700 transition-colors">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg leading-none block">ML Imóveis</span>
              <span className="text-[10px] text-slate-400 font-medium">Marketplace Imobiliário</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.fullName[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.fullName.split(" ")[0]}</span>
                  <span className="badge bg-brand-100 text-brand-700">{user.role}</span>
                </div>
                <Link to={dashboardPath} className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-sm">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Link>
                <Link to="/register" className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
