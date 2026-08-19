'use client';

// src/features/settings/components/MobileProfileEditor.tsx
//
// @eligi:mobile-profile-editor
// A tela de Aparencia no celular: o link publico e' o heroi e se edita tocando
// nele. Cada folha cuida de UM assunto e salva a propria secao — no mobile nao
// existe mais o botao unico "Salvar personalizacao".
//
// POR QUE SEM BOTAO UNICO
// Um Salvar no rodape de uma tela longa obriga a rolar de volta e deixa duvida
// sobre o que foi gravado. Salvando por assunto, o botao pode dizer exatamente
// o que faz e a falha fica confinada aquele assunto.
//
// Este componente NAO tem estado de rascunho nem fala com a API: recebe o draft
// e os handlers do ProfileThemeEditor, que segue sendo o dono.

import { useState } from 'react';
import {
  Image as ImageIcon, Palette, AlignLeft, MapPin, Share2, Camera,
  Users, Check, AlertTriangle,
} from 'lucide-react';
import {
  type BusinessTheme,
  type BusinessSocials,
  type ThemePreset,
  type ReadabilityCheck,
} from '@/shared/profileTheme';
import type { BusinessProfileDraft, ProfileSection } from '../hooks/useBusinessProfileDraft';
import BusinessPreview, { type PreviewSlot } from './BusinessPreview';
import EditSheet from './EditSheet';
import {
  IdentityFields,
  AboutField,
  AddressField,
  SocialsField,
  TeamAndPhotosFields,
  ColorsFields,
  type CropTarget,
} from './ProfileFields';

interface SlotConfig {
  title: string;
  subtitle: string;
  saveLabel: string;
  icon: React.ReactNode;
  sections: ProfileSection[];
}

const SLOTS: Record<PreviewSlot, SlotConfig> = {
  logo: {
    title: 'Logo',
    subtitle: 'Vira o ícone do app do cliente e aparece na capa, no recibo e na nota fiscal.',
    saveLabel: 'Salvar logo',
    icon: <ImageIcon size={18} />,
    sections: ['images', 'theme'],
  },
  appearance: {
    title: 'Cores e capa',
    subtitle: 'A cor principal pinta a capa, os botões e o cartão digital do cliente.',
    saveLabel: 'Salvar cores',
    icon: <Palette size={18} />,
    sections: ['theme', 'images'],
  },
  about: {
    title: 'Sobre nós',
    subtitle: 'Aparece logo abaixo do nome, no seu link de agendamento.',
    saveLabel: 'Salvar descrição',
    icon: <AlignLeft size={18} />,
    sections: ['profile'],
  },
  address: {
    title: 'Endereço',
    subtitle: 'Usado no mapa do seu link e no botão “Como chegar”.',
    saveLabel: 'Salvar endereço',
    icon: <MapPin size={18} />,
    sections: ['profile'],
  },
  socials: {
    title: 'Redes sociais',
    subtitle: 'Viram ícones clicáveis no rodapé do seu link.',
    saveLabel: 'Salvar redes',
    icon: <Share2 size={18} />,
    sections: ['profile'],
  },
  photos: {
    title: 'Fotos do espaço',
    subtitle: 'Até 3 fotos, que o cliente vê antes de agendar.',
    saveLabel: 'Salvar fotos',
    icon: <Camera size={18} />,
    sections: ['gallery'],
  },
};

interface Props {
  businessName: string;
  draft: BusinessProfileDraft;
  extracted: string[];
  readability: ReadabilityCheck;
  onPickFile: (file: File, target: CropTarget) => void;
  onSetTheme: <K extends keyof BusinessTheme>(key: K, value: BusinessTheme[K]) => void;
  onApplyPreset: (preset: ThemePreset) => void;
  onSetSocial: (key: keyof BusinessSocials, value: string) => void;
}

export function MobileProfileEditor({
  businessName, draft, extracted, readability,
  onPickFile, onSetTheme, onApplyPreset, onSetSocial,
}: Props) {
  const [slot, setSlot] = useState<PreviewSlot | null>(null);
  const [justSaved, setJustSaved] = useState<PreviewSlot | null>(null);

  const cfg = slot ? SLOTS[slot] : null;
  const saving = cfg ? cfg.sections.some(s => draft.status[s] === 'saving') : false;
  const sheetError = cfg
    ? cfg.sections.map(s => draft.errors[s]).find(Boolean) ?? null
    : null;

  async function handleSave() {
    if (!slot || !cfg) return;
    let ok = true;
    // Em serie: sao escritas no mesmo registro.
    for (const section of cfg.sections) {
      const done = await draft.saveSection(section);
      if (!done) ok = false;
    }
    if (!ok) return; // folha continua aberta, com o erro visivel
    setJustSaved(slot);
    setSlot(null);
    window.setTimeout(() => setJustSaved(null), 2200);
  }

  return (
    <div style={{ fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
      <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: 'rgba(0,0,0,0.5)' }}>
        Toque em qualquer parte do seu link para editar.
      </p>

      {justSaved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e9f7f1', border: '1px solid #b9e6d3', color: '#047857', borderRadius: 12, padding: '10px 13px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
          <Check size={16} />
          {SLOTS[justSaved].title} salvo.
        </div>
      )}

      <BusinessPreview
        businessName={businessName}
        theme={draft.theme}
        logoUrl={draft.logoUrl}
        coverUrl={draft.coverUrl}
        about={draft.about}
        address={draft.address}
        socials={draft.socials}
        gallery={draft.gallery}
        onEditSlot={setSlot}
      />

      <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e7e7ec', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '14px 15px' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f1f4', color: '#52525b', display: 'grid', placeItems: 'center', flex: 'none' }}>
            <Users size={17} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f0f14' }}>Equipe</div>
            <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.5)', lineHeight: 1.45, marginTop: 2 }}>
              Quem aparece no link vem de <b>Equipe</b>, pelos profissionais com agendamento online.
            </div>
          </div>
        </div>
      </div>

      {slot && cfg && (
        <EditSheet
          title={cfg.title}
          subtitle={cfg.subtitle}
          icon={cfg.icon}
          saveLabel={cfg.saveLabel}
          saving={saving}
          error={sheetError}
          onSave={handleSave}
          onClose={() => setSlot(null)}
        >
          {slot === 'logo' && (
            <IdentityFields
              businessName={businessName}
              logoUrl={draft.logoUrl}
              coverUrl={draft.coverUrl}
              primary={draft.theme.primary}
              extracted={extracted}
              onPickFile={onPickFile}
              onRemoveLogo={() => draft.setLogoUrl(null)}
              onPickExtracted={c => onSetTheme('primary', c)}
              onPickCoverPreset={v => draft.setCoverUrl(v)}
              showName={false}
            />
          )}

          {slot === 'appearance' && (
            <>
              <ColorsFields
                theme={draft.theme}
                onSet={onSetTheme}
                onApplyPreset={onApplyPreset}
              />
              {readability.ok ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#047857', fontSize: 12.5, fontWeight: 600, marginTop: 14 }}>
                  <Check size={15} /> Contraste {readability.ratio.toFixed(1)}:1 — texto legível no botão.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 11, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginTop: 14, lineHeight: 1.4 }}>
                  <AlertTriangle size={15} style={{ flex: 'none', marginTop: 1 }} />
                  <span>Contraste baixo no botão ({readability.ratio.toFixed(1)}:1). Sugerimos texto {readability.suggestedOnPrimary === '#ffffff' ? 'branco' : 'escuro'}.</span>
                </div>
              )}
            </>
          )}

          {slot === 'about' && (
            <AboutField value={draft.about} onChange={draft.setAbout} showLabel={false} />
          )}

          {slot === 'address' && (
            <AddressField
              address={draft.address}
              lat={draft.lat}
              lng={draft.lng}
              onChangeAddress={draft.setAddress}
              onChangeCoords={(la, ln) => { draft.setLat(la); draft.setLng(ln); }}
              showLabel={false}
            />
          )}

          {slot === 'socials' && (
            <SocialsField socials={draft.socials} onChange={onSetSocial} showLabel={false} />
          )}

          {slot === 'photos' && (
            <TeamAndPhotosFields
              gallery={draft.gallery}
              onPickFile={onPickFile}
              onRemovePhoto={i => draft.setGallery(arr => arr.filter((_, j) => j !== i))}
              showTeamNote={false}
            />
          )}
        </EditSheet>
      )}
    </div>
  );
}

export default MobileProfileEditor;
