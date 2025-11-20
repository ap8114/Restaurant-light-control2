#!/bin/bash
# Resume Commands for Restaurant POS Deployment

echo "======================================"
echo "Restaurant POS - Resume Session"
echo "======================================"
echo ""
echo "Project Status: 95% Complete"
echo "Location: /root/Restaurant-light-control2"
echo "Next Step: Deploy to alexandratechlab.com"
echo ""
echo "======================================"
echo "Quick Status Check"
echo "======================================"

# Check project location
cd /root/Restaurant-light-control2
pwd

# Check git status
echo ""
echo "Git Status:"
git log --oneline -1
git status --short

# Check build
echo ""
echo "Build Status:"
if [ -d "dist" ]; then
    echo "✅ Production build exists (dist/ folder)"
    ls -lh dist/ | head -5
else
    echo "❌ Build missing - run: npm run build"
fi

# Check services
echo ""
echo "Services Status:"
if [ -f "src/services/TapoSmartPlugService.js" ]; then
    echo "✅ TapoSmartPlugService.js ($(wc -l < src/services/TapoSmartPlugService.js) lines)"
else
    echo "❌ TapoSmartPlugService.js missing"
fi

if [ -f "src/services/PrinterService.js" ]; then
    echo "✅ PrinterService.js ($(wc -l < src/services/PrinterService.js) lines)"
else
    echo "❌ PrinterService.js missing"
fi

# Check documentation
echo ""
echo "Documentation Status:"
for doc in IMPLEMENTATION_PLAN.md INSTALLATION_GUIDE.md QUICK_START.md deploy-alexandratechlab.md SESSION_RESUME_GUIDE.md; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "❌ $doc missing"
    fi
done

# Check dependencies
echo ""
echo "Dependencies Status:"
if npm list tp-link-tapo-connect > /dev/null 2>&1; then
    echo "✅ tp-link-tapo-connect installed"
else
    echo "❌ tp-link-tapo-connect missing"
fi

if npm list node-thermal-printer > /dev/null 2>&1; then
    echo "✅ node-thermal-printer installed"
else
    echo "❌ node-thermal-printer missing"
fi

echo ""
echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "1. Read SESSION_RESUME_GUIDE.md for full context"
echo "2. Launch complex-task-orchestrator Sonnet agent"
echo "3. Use the exact prompt from SESSION_RESUME_GUIDE.md"
echo ""
echo "Quick Deploy Commands:"
echo "  Netlify: netlify deploy --prod --dir=dist"
echo "  Vercel:  vercel --prod"
echo ""
echo "======================================"
echo "Ready to Deploy! 🚀"
echo "======================================"
