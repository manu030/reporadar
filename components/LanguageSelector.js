import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LanguageSelector() {
  const { locale, asPath } = useRouter();

  return (
    <div className="flex items-center gap-1 text-sm">
      <Link
        href={asPath}
        locale="es"
        className={`px-3 py-2 font-semibold transition-all duration-150 border-2 border-primary rounded-sm ${
          locale === 'es'
            ? 'bg-primary text-secondary shadow-brutal-sm'
            : 'bg-secondary text-primary hover:bg-primary hover:text-secondary hover:shadow-brutal-sm hover:translate-x-1 hover:translate-y-1'
        }`}
      >
        ES
      </Link>
      <Link
        href={asPath}
        locale="en"
        className={`px-3 py-2 font-semibold transition-all duration-150 border-2 border-primary rounded-sm ${
          locale === 'en'
            ? 'bg-primary text-secondary shadow-brutal-sm'
            : 'bg-secondary text-primary hover:bg-primary hover:text-secondary hover:shadow-brutal-sm hover:translate-x-1 hover:translate-y-1'
        }`}
      >
        EN
      </Link>
    </div>
  );
}