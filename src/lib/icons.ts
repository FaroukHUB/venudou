import {
  Cake,
  Coffee,
  EyeOff,
  Facebook,
  Ghost,
  Gift,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  MessagesSquare,
  MoreHorizontal,
  Music2,
  Newspaper,
  Search,
  Star,
  Store,
  User,
  Users,
  Utensils,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

/**
 * Bibliothèque d'icônes cohérente proposée aux commerçants pour les options
 * du questionnaire. Les valeurs stockées en base (`question_options.icon`)
 * sont les clés de cette map.
 */
export const OPTION_ICONS: Record<string, LucideIcon> = {
  Facebook,
  Instagram,
  Ghost,
  Music2,
  Search,
  MessagesSquare,
  MoreHorizontal,
  Globe,
  Youtube,
  Linkedin,
  Newspaper,
  MapPin,
  Store,
  Star,
  Gift,
  Coffee,
  Utensils,
  Cake,
  User,
  Users,
  EyeOff,
};

export function iconFor(name: string): LucideIcon | null {
  return OPTION_ICONS[name] ?? null;
}
