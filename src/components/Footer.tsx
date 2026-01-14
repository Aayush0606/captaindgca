export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-2 py-4">
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DGCA Question Bank. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made for aspiring pilots in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
