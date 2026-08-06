import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/Field';
import { Toggle, StatCard } from '@/components/ui/misc';

describe('composants UI', () => {
  it('Button : désactivé pendant le chargement', () => {
    render(<Button loading>Envoyer</Button>);
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled();
  });

  it('InputField : label associé et erreur annoncée', () => {
    render(<InputField label="Adresse e-mail" error="E-mail invalide" />);
    const input = screen.getByLabelText('Adresse e-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail invalide');
  });

  it('Toggle : accessible au clavier avec rôle switch', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Question active" />);
    const toggle = screen.getByRole('switch', { name: 'Question active' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('StatCard : affiche libellé et valeur', () => {
    render(<StatCard label="Réponses" value={42} sub="30 jours" />);
    expect(screen.getByText('Réponses')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
