git update-ref -d HEAD
git reset

git add PLAN.md
git commit -m "docs: add project plan"

git add package.json package-lock.json
git commit -m "chore: add package dependencies"

git add app.json tsconfig.json .gitignore
git commit -m "chore: add expo configuration files"

git add theme/
git commit -m "feat: setup theme tokens and system"

git add stores/
git commit -m "feat: setup zustand state stores"

git add lib/
git commit -m "feat: add supabase and auth helpers"

git add components/
git commit -m "feat: add ThemeSwitcher component"

git add constants/
git commit -m "feat: add challenge templates"

git add supabase/
git commit -m "chore: setup supabase sql schema"

git add app/_layout.tsx
git commit -m "feat: add root navigation layout"

git add app/(auth)/
git commit -m "feat: add authentication screens"

git add app/(tabs)/
git commit -m "feat: add tab navigation and screens"

git push -u origin main -f
