#!/bin/bash

# ============================================================
# ELIGI — Deploy Polish Script
# Uso: bash deploy-polish.sh [caminho/para/outputs]
# Se não passar argumento, usa ./outputs/ relativo ao projeto
# ============================================================

set -e

PROJECT="$(pwd)"
OUTPUTS="${1:-$PROJECT/outputs}"
BACKUP="$PROJECT/.backup/$(date +%Y%m%d_%H%M%S)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }

backup() {
  local rel="$1"
  if [ -f "$PROJECT/$rel" ]; then
    mkdir -p "$(dirname "$BACKUP/$rel")"
    cp "$PROJECT/$rel" "$BACKUP/$rel"
  fi
}

copy() {
  local src="$OUTPUTS/$1"
  local dst="$PROJECT/$2"
  if [ ! -f "$src" ]; then
    warn "Não encontrado: $1"
    return
  fi
  backup "$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  log "$2"
}

echo ""
echo "============================================================"
echo " ELIGI Polish Deploy"
echo " Origem:  $OUTPUTS"
echo " Projeto: $PROJECT"
echo " Backup:  $BACKUP"
echo "============================================================"
echo ""

# ── globals & layout ─────────────────────────────────────────
echo "[ globals & layout ]"
copy "globals.css"         "src/styles/globals.css"
copy "layout.tsx"          "src/app/layout.tsx"
copy "DashboardLayout.tsx" "src/app/dashboard/layout.tsx"

# ── navigation ───────────────────────────────────────────────
echo ""; echo "[ navigation ]"
copy "AppNavbar.tsx" "src/app/components/navigation/AppNavbar.tsx"
copy "Sidebar.tsx"   "src/app/components/navigation/Sidebar.tsx"
copy "NavItem.tsx"   "src/app/components/navigation/NavItem.tsx"

# ── auth components ───────────────────────────────────────────
echo ""; echo "[ auth components ]"
copy "auth.module.css"      "src/app/components/auth/auth.module.css"
copy "AuthInput.module.css" "src/app/components/auth/AuthInput.module.css"
copy "AuthButton.tsx"       "src/app/components/auth/AuthButton.tsx"
copy "AuthCard.tsx"         "src/app/components/auth/AuthCard.tsx"
copy "AuthInput.tsx"        "src/app/components/auth/AuthInput.tsx"
copy "AuthRoleSelect.tsx"   "src/app/components/auth/AuthRoleSelect.tsx"

# ── auth pages ────────────────────────────────────────────────
echo ""; echo "[ auth pages ]"
copy "LoginForm.tsx"       "src/app/login/LoginForm.tsx"
copy "LoginPage.tsx"       "src/app/login/page.tsx"
copy "Login.module.css"    "src/app/login/Login.module.css"
copy "RegisterForm.tsx"    "src/app/register/RegisterForm.tsx"
copy "RegisterPage.tsx"    "src/app/register/page.tsx"
copy "Register.module.css" "src/app/register/Register.module.css"

# ── hooks ─────────────────────────────────────────────────────
echo ""; echo "[ hooks ]"
copy "useAuth.ts" "src/hooks/useAuth.ts"

# ── dashboard components ──────────────────────────────────────
echo ""; echo "[ dashboard components ]"
copy "BookingCard.tsx"       "src/app/components/dashboard/BookingCard.tsx"
copy "DashboardHeader.tsx"   "src/app/components/dashboard/DashboardHeader.tsx"
copy "DashboardKPIs.tsx"     "src/app/components/dashboard/DashboardKPIs.tsx"
copy "RevenueLineChart.tsx"  "src/app/components/dashboard/RevenueLineChart.tsx"
copy "WeeklyDemandChart.tsx" "src/app/components/dashboard/WeeklyDemandChart.tsx"
copy "TopBarbers.tsx"        "src/app/components/dashboard/TopBarbers.tsx"

# ── ui components ─────────────────────────────────────────────
echo ""; echo "[ ui components ]"
copy "DashboardMetricCard.module.css" "src/app/components/ui/DashboardMetricCard.module.css"
copy "DashboardMetricCard.tsx"        "src/app/components/ui/DashboardMetricCard.tsx"
copy "TrendChart.module.css"          "src/app/components/ui/TrendChart.module.css"
copy "TrendChart.tsx"                 "src/app/components/ui/TrendChart.tsx"
copy "FloatingWhatsApp.module.css"    "src/app/components/ui/FloatingWhatsApp.module.css"
copy "FloatingWhatsApp.tsx"           "src/app/components/ui/FloatingWhatsApp.tsx"
copy "GoogleIcon.tsx"                 "src/app/components/ui/GoogleIcon.tsx"

# ── system ───────────────────────────────────────────────────
echo ""; echo "[ system ]"
copy "SectionShell.module.css" "src/app/components/system/SectionShell.module.css"
copy "SectionShell.tsx"        "src/app/components/system/SectionShell.tsx"

# ── search ───────────────────────────────────────────────────
echo ""; echo "[ search ]"
copy "CommandPalette.tsx" "src/app/components/search/CommandPalette.tsx"

# ── landing navbar ────────────────────────────────────────────
echo ""; echo "[ landing ]"
copy "Navbar.tsx"             "src/app/components/navbar/Navbar.tsx"
copy "HeroSection.module.css" "src/app/components/hero/HeroSection.module.css"

# ── sections ─────────────────────────────────────────────────
echo ""; echo "[ sections ]"
copy "AgendaSection.module.css"        "src/app/components/sections/AgendaSection.module.css"
copy "AgendaSection.tsx"               "src/app/components/sections/AgendaSection.tsx"
copy "DashboardPreview.module.css"     "src/app/components/sections/DashboardPreview.module.css"
copy "DashboardPreview.tsx"            "src/app/components/sections/DashboardPreview.tsx"
copy "Ecosystem.module.css"            "src/app/components/sections/Ecosystem.module.css"
copy "Ecosystem.tsx"                   "src/app/components/sections/Ecosystem.tsx"
copy "FAQSection.module.css"           "src/app/components/sections/FAQSection.module.css"
copy "FAQSection.tsx"                  "src/app/components/sections/FAQSection.tsx"
copy "FinalCTA.module.css"             "src/app/components/sections/FinalCTA.module.css"
copy "FinalCTA.tsx"                    "src/app/components/sections/FinalCTA.tsx"
copy "MetricsStrip.module.css"         "src/app/components/sections/MetricsStrip.module.css"
copy "MetricsStrip.tsx"                "src/app/components/sections/MetricsStrip.tsx"
copy "PricingSection.module.css"       "src/app/components/sections/PricingSection.module.css"
copy "PricingSection.tsx"              "src/app/components/sections/PricingSection.tsx"
copy "ProfessionalsSection.module.css" "src/app/components/sections/ProfessionalsSection.module.css"
copy "ProfessionalsSection.tsx"        "src/app/components/sections/ProfessionalsSection.tsx"
copy "StatisticsSection.module.css"    "src/app/components/sections/StatisticsSection.module.css"
copy "StatisticsSection.tsx"           "src/app/components/sections/StatisticsSection.tsx"

# ── footer ───────────────────────────────────────────────────
echo ""; echo "[ footer ]"
copy "Footer.module.css" "src/app/components/footer/Footer.module.css"
copy "Footer.tsx"        "src/app/components/footer/Footer.tsx"

# ── done ─────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e " ${GREEN}Deploy concluído!${NC}"
echo " Backup em: $BACKUP"
echo ""
echo " Próximos passos:"
echo "   npm run lint && npm run build"
echo "============================================================"
echo ""