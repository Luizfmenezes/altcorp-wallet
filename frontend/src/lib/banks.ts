export interface BankInfo {
  id: string;
  name: string;
  color: string;
  textColor: string;
  icon: string;       // sigla curta (fallback quando nao ha SVG)
  shortName: string;
  logo?: string;      // caminho local do SVG em /banks/
}

export const BRAZILIAN_BANKS: BankInfo[] = [
  // ─── Bancos populares (com SVG) ───
  { id: 'nubank', name: 'Nubank', shortName: 'Nu', color: '#820AD1', textColor: '#FFFFFF', icon: 'Nu', logo: undefined },
  { id: 'itau', name: 'Itau Unibanco', shortName: 'Itau', color: '#FF6600', textColor: '#003399', icon: 'iti', logo: undefined },
  { id: 'bradesco', name: 'Bradesco', shortName: 'Brad', color: '#CC092F', textColor: '#FFFFFF', icon: 'Br', logo: undefined },
  { id: 'bb', name: 'Banco do Brasil', shortName: 'BB', color: '#FFCC00', textColor: '#003399', icon: 'BB', logo: undefined },
  { id: 'caixa', name: 'Caixa Economica', shortName: 'CEF', color: '#005CA9', textColor: '#FFFFFF', icon: 'CX', logo: '/banks/caixa.svg' },
  { id: 'santander', name: 'Santander', shortName: 'Sant', color: '#EC0000', textColor: '#FFFFFF', icon: 'S', logo: undefined },
  { id: 'inter', name: 'Banco Inter', shortName: 'Inter', color: '#FF7A00', textColor: '#FFFFFF', icon: 'Bi', logo: undefined },
  { id: 'c6', name: 'C6 Bank', shortName: 'C6', color: '#242424', textColor: '#FFFFFF', icon: 'C6', logo: undefined },
  { id: 'btg', name: 'BTG Pactual', shortName: 'BTG', color: '#00263E', textColor: '#FFFFFF', icon: 'BTG', logo: '/banks/btg.svg' },
  { id: 'xp', name: 'XP Investimentos', shortName: 'XP', color: '#000000', textColor: '#FFCC00', icon: 'XP', logo: '/banks/xp.svg' },
  { id: 'neon', name: 'Neon', shortName: 'Neon', color: '#32D9A2', textColor: '#1A1A2E', icon: 'Ne', logo: '/banks/neon.svg' },
  { id: 'next', name: 'Next', shortName: 'Next', color: '#00E676', textColor: '#1A1A2E', icon: 'Nx', logo: undefined },
  { id: 'picpay', name: 'PicPay', shortName: 'Pic', color: '#21C25E', textColor: '#FFFFFF', icon: 'PP', logo: '/banks/picpay.svg' },
  { id: 'mercadopago', name: 'Mercado Pago', shortName: 'MP', color: '#00BCFF', textColor: '#FFFFFF', icon: 'MP', logo: '/banks/mercadopago.svg' },
  { id: 'pagbank', name: 'PagBank', shortName: 'Pag', color: '#00A650', textColor: '#FFFFFF', icon: 'PB', logo: undefined },
  { id: 'will', name: 'Will Bank', shortName: 'Will', color: '#FFE600', textColor: '#1A1A2E', icon: 'W', logo: undefined },
  { id: 'sicoob', name: 'Sicoob', shortName: 'Sic', color: '#003B2D', textColor: '#FFFFFF', icon: 'Si', logo: '/banks/sicoob.svg' },
  { id: 'sicredi', name: 'Sicredi', shortName: 'Sicr', color: '#008C3C', textColor: '#FFFFFF', icon: 'Sc', logo: '/banks/sicredi.svg' },
  { id: 'banrisul', name: 'Banrisul', shortName: 'Banr', color: '#003399', textColor: '#FFFFFF', icon: 'Ba', logo: '/banks/banrisul.svg' },
  { id: 'original', name: 'Banco Original', shortName: 'Orig', color: '#00A651', textColor: '#FFFFFF', icon: 'Or', logo: undefined },
  { id: 'safra', name: 'Banco Safra', shortName: 'Safra', color: '#003366', textColor: '#FFFFFF', icon: 'Sf', logo: undefined },
  { id: 'pan', name: 'Banco Pan', shortName: 'Pan', color: '#00ADEF', textColor: '#FFFFFF', icon: 'Pn', logo: undefined },
  { id: 'bmg', name: 'Banco BMG', shortName: 'BMG', color: '#FF6600', textColor: '#FFFFFF', icon: 'BG', logo: '/banks/bmg.svg' },
  { id: 'daycoval', name: 'Daycoval', shortName: 'Day', color: '#003366', textColor: '#FFFFFF', icon: 'Dy', logo: '/banks/daycoval.svg' },
  { id: 'ame', name: 'Ame Digital', shortName: 'Ame', color: '#FF0066', textColor: '#FFFFFF', icon: 'Am', logo: undefined },
  { id: 'stone', name: 'Stone', shortName: 'Stone', color: '#00A868', textColor: '#FFFFFF', icon: 'St', logo: undefined },
  { id: 'modal', name: 'Banco Modal', shortName: 'Modal', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Md', logo: undefined },
  { id: 'sofisa', name: 'Sofisa Direto', shortName: 'Sof', color: '#333333', textColor: '#FFFFFF', icon: 'So', logo: '/banks/sofisa.svg' },
  { id: 'agibank', name: 'Agibank', shortName: 'Agi', color: '#5B2D8E', textColor: '#FFFFFF', icon: 'Ag', logo: undefined },
  { id: 'digio', name: 'Digio', shortName: 'Digio', color: '#003CFF', textColor: '#FFFFFF', icon: 'Di', logo: undefined },
  { id: 'rico', name: 'Rico', shortName: 'Rico', color: '#FF5900', textColor: '#FFFFFF', icon: 'Ri', logo: undefined },

  // ─── Bancos com SVG (novos da pasta Bancos-em-SVG) ───
  { id: 'abcbrasil', name: 'ABC Brasil', shortName: 'ABC', color: '#003B71', textColor: '#FFFFFF', icon: 'ABC', logo: '/banks/abcbrasil.svg' },
  { id: 'ailos', name: 'Ailos', shortName: 'Ailos', color: '#00A859', textColor: '#FFFFFF', icon: 'Ai', logo: '/banks/ailos.svg' },
  { id: 'arbi', name: 'Banco Arbi', shortName: 'Arbi', color: '#1A3A6B', textColor: '#FFFFFF', icon: 'Ar', logo: '/banks/arbi.svg' },
  { id: 'banese', name: 'Banese', shortName: 'Ban', color: '#003399', textColor: '#FFFFFF', icon: 'Bn', logo: '/banks/banese.svg' },
  { id: 'banestes', name: 'Banestes', shortName: 'Bnst', color: '#003366', textColor: '#FFFFFF', icon: 'Bs', logo: '/banks/banestes.svg' },
  { id: 'bankofamerica', name: 'Bank of America', shortName: 'BoA', color: '#012169', textColor: '#FFFFFF', icon: 'BA', logo: '/banks/bankofamerica.svg' },
  { id: 'banpara', name: 'Banpara', shortName: 'Bnpr', color: '#003399', textColor: '#FFFFFF', icon: 'Bp', logo: '/banks/banpara.svg' },
  { id: 'bancopaulista', name: 'Banco Paulista', shortName: 'Paul', color: '#1A3A6B', textColor: '#FFFFFF', icon: 'BP', logo: '/banks/bancopaulista.svg' },
  { id: 'beesbank', name: 'Bees Bank', shortName: 'Bees', color: '#FFD100', textColor: '#1A1A2E', icon: 'Be', logo: '/banks/beesbank.svg' },
  { id: 'bkbank', name: 'BK Bank', shortName: 'BK', color: '#000000', textColor: '#FFFFFF', icon: 'BK', logo: '/banks/bkbank.svg' },
  { id: 'bmp', name: 'Banco BMP', shortName: 'BMP', color: '#1A3A6B', textColor: '#FFFFFF', icon: 'BM', logo: '/banks/bmp.svg' },
  { id: 'bnpparibas', name: 'BNP Paribas', shortName: 'BNP', color: '#00915A', textColor: '#FFFFFF', icon: 'BN', logo: '/banks/bnpparibas.svg' },
  { id: 'brb', name: 'BRB', shortName: 'BRB', color: '#004B8D', textColor: '#FFFFFF', icon: 'BRB', logo: '/banks/brb.svg' },
  { id: 'bv', name: 'Banco BV', shortName: 'BV', color: '#003B71', textColor: '#FFFFFF', icon: 'BV', logo: '/banks/bv.svg' },
  { id: 'capitual', name: 'Capitual', shortName: 'Cap', color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Ca', logo: '/banks/capitual.svg' },
  { id: 'contasimples', name: 'Conta Simples', shortName: 'CS', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'CS', logo: '/banks/contasimples.svg' },
  { id: 'contbank', name: 'Contbank', shortName: 'Cont', color: '#003366', textColor: '#FFFFFF', icon: 'Cb', logo: '/banks/contbank.svg' },
  { id: 'credisis', name: 'Credisis', shortName: 'Cred', color: '#003B71', textColor: '#FFFFFF', icon: 'Cr', logo: '/banks/credisis.svg' },
  { id: 'cresol', name: 'Cresol', shortName: 'Cres', color: '#F37021', textColor: '#FFFFFF', icon: 'Cs', logo: '/banks/cresol.svg' },
  { id: 'duepay', name: 'DuePay', shortName: 'Due', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Du', logo: '/banks/duepay.svg' },
  { id: 'efi', name: 'Efi Bank', shortName: 'Efi', color: '#F37021', textColor: '#FFFFFF', icon: 'Ef', logo: '/banks/efi.svg' },
  { id: 'grafeno', name: 'Grafeno', shortName: 'Graf', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Gr', logo: '/banks/grafeno.svg' },
  { id: 'ifoodpago', name: 'iFood Pago', shortName: 'iFood', color: '#EA1D2C', textColor: '#FFFFFF', icon: 'iF', logo: '/banks/ifoodpago.svg' },
  { id: 'infinitepay', name: 'InfinitePay', shortName: 'Inf', color: '#000000', textColor: '#00E676', icon: 'IP', logo: '/banks/infinitepay.svg' },
  { id: 'ip4y', name: 'Ip4y', shortName: 'Ip4y', color: '#003B71', textColor: '#FFFFFF', icon: 'Ip', logo: '/banks/ip4y.svg' },
  { id: 'iugo', name: 'Iugo', shortName: 'Iugo', color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Iu', logo: '/banks/iugo.svg' },
  { id: 'linker', name: 'Linker', shortName: 'Link', color: '#00C4B3', textColor: '#FFFFFF', icon: 'Lk', logo: '/banks/linker.svg' },
  { id: 'magalupay', name: 'MagaluPay', shortName: 'Mag', color: '#0086FF', textColor: '#FFFFFF', icon: 'Mg', logo: '/banks/magalupay.svg' },
  { id: 'modobank', name: 'ModoBank', shortName: 'Modo', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Mo', logo: '/banks/modobank.svg' },
  { id: 'mufg', name: 'MUFG', shortName: 'MUFG', color: '#DA291C', textColor: '#FFFFFF', icon: 'MU', logo: '/banks/mufg.svg' },
  { id: 'multiplo', name: 'Multiplo Bank', shortName: 'Mult', color: '#1A3A6B', textColor: '#FFFFFF', icon: 'Mt', logo: '/banks/multiplo.svg' },
  { id: 'omie', name: 'Omie.Cash', shortName: 'Omie', color: '#003366', textColor: '#FFFFFF', icon: 'Om', logo: '/banks/omie.svg' },
  { id: 'omni', name: 'Omni', shortName: 'Omni', color: '#003B71', textColor: '#FFFFFF', icon: 'On', logo: '/banks/omni.svg' },
  { id: 'paycash', name: 'PayCash', shortName: 'Pay', color: '#00A650', textColor: '#FFFFFF', icon: 'PC', logo: '/banks/paycash.svg' },
  { id: 'pinbank', name: 'PinBank', shortName: 'Pin', color: '#FF6600', textColor: '#FFFFFF', icon: 'Pi', logo: '/banks/pinbank.svg' },
  { id: 'pine', name: 'Banco Pine', shortName: 'Pine', color: '#003366', textColor: '#FFFFFF', icon: 'Pe', logo: '/banks/pine.svg' },
  { id: 'quality', name: 'Quality Digital', shortName: 'Qual', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Qd', logo: '/banks/quality.svg' },
  { id: 'recargapay', name: 'RecargaPay', shortName: 'Rec', color: '#FF6600', textColor: '#FFFFFF', icon: 'RP', logo: '/banks/recargapay.svg' },
  { id: 'rendimento', name: 'Banco Rendimento', shortName: 'Rend', color: '#003366', textColor: '#FFFFFF', icon: 'Rd', logo: '/banks/rendimento.svg' },
  { id: 'sisprime', name: 'Sisprime', shortName: 'Sis', color: '#003B2D', textColor: '#FFFFFF', icon: 'Sp', logo: '/banks/sisprime.svg' },
  { id: 'squid', name: 'Squid', shortName: 'Sqd', color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Sq', logo: '/banks/squid.svg' },
  { id: 'starbank', name: 'StarBank', shortName: 'Star', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'SB', logo: '/banks/starbank.svg' },
  { id: 'sulcredi', name: 'Sulcredi', shortName: 'Sulc', color: '#003B2D', textColor: '#FFFFFF', icon: 'Sl', logo: '/banks/sulcredi.svg' },
  { id: 'topazio', name: 'Banco Topazio', shortName: 'Top', color: '#003B71', textColor: '#FFFFFF', icon: 'Tz', logo: '/banks/topazio.svg' },
  { id: 'transfera', name: 'Transfeera', shortName: 'Trf', color: '#00A859', textColor: '#FFFFFF', icon: 'Tf', logo: '/banks/transfera.svg' },
  { id: 'tribanco', name: 'Tribanco', shortName: 'Trib', color: '#003B71', textColor: '#FFFFFF', icon: 'Tb', logo: '/banks/tribanco.svg' },
  { id: 'unicred', name: 'Unicred', shortName: 'Unic', color: '#00A859', textColor: '#FFFFFF', icon: 'Uc', logo: '/banks/unicred.svg' },
  { id: 'uniprime', name: 'Uniprime', shortName: 'Uni', color: '#003B2D', textColor: '#FFFFFF', icon: 'Up', logo: '/banks/uniprime.svg' },
  { id: 'zemobank', name: 'Zemo Bank', shortName: 'Zemo', color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Zm', logo: '/banks/zemobank.svg' },

  // ─── Generico ───
  { id: 'outro', name: 'Outro', shortName: 'Outro', color: '#6B7280', textColor: '#FFFFFF', icon: '?' },
];

export const getBankById = (id: string | null | undefined): BankInfo | undefined => {
  if (!id) return undefined;
  return BRAZILIAN_BANKS.find(b => b.id === id);
};

export const getBankName = (id: string | null | undefined): string => {
  const bank = getBankById(id);
  return bank?.name || '';
};
