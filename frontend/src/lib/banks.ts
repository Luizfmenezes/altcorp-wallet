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
  // ─── Bancos populares ───
  { id: 'nubank',       name: 'Nubank',              shortName: 'Nu',     color: '#820AD1', textColor: '#FFFFFF', icon: 'Nu',   logo: '/banks_1/nubank.svg' },
  { id: 'itau',         name: 'Itau Unibanco',        shortName: 'Itaú',   color: '#EC7000', textColor: '#FFFFFF', icon: 'Itaú', logo: '/banks_1/itau.svg' },
  { id: 'bradesco',     name: 'Bradesco',             shortName: 'Brad',   color: '#CC092F', textColor: '#FFFFFF', icon: 'Brad', logo: '/banks_1/bradesco.svg' },
  { id: 'bb',           name: 'Banco do Brasil',      shortName: 'BB',     color: '#FAE128', textColor: '#002D74', icon: 'BB',   logo: '/banks_1/bb.svg' },
  { id: 'caixa',        name: 'Caixa Economica',      shortName: 'CEF',    color: '#005CA9', textColor: '#FFFFFF', icon: 'CX',   logo: '/banks_1/caixa.svg' },
  { id: 'santander',    name: 'Santander',            shortName: 'Sant',   color: '#EC0000', textColor: '#FFFFFF', icon: 'San',  logo: '/banks_1/santander.svg' },
  { id: 'inter',        name: 'Banco Inter',          shortName: 'Inter',  color: '#FF7A00', textColor: '#FFFFFF', icon: 'Int',  logo: '/banks_1/inter.svg' },
  { id: 'c6',           name: 'C6 Bank',              shortName: 'C6',     color: '#1C1C1C', textColor: '#F5C96B', icon: 'C6',   logo: '/banks_1/c6.svg' },
  { id: 'btg',          name: 'BTG Pactual',          shortName: 'BTG',    color: '#00263E', textColor: '#FFFFFF', icon: 'BTG',  logo: '/banks_1/btg.svg' },
  { id: 'xp',           name: 'XP Investimentos',     shortName: 'XP',     color: '#000000', textColor: '#FFCC00', icon: 'XP',   logo: '/banks_1/xp.svg' },
  { id: 'neon',         name: 'Neon',                 shortName: 'Neon',   color: '#32D9A2', textColor: '#1A1A2E', icon: 'Ne',   logo: '/banks_1/neon.svg' },
  { id: 'next',         name: 'Next',                 shortName: 'Next',   color: '#00E676', textColor: '#1A1A2E', icon: 'Nx' },
  { id: 'picpay',       name: 'PicPay',               shortName: 'Pic',    color: '#21C25E', textColor: '#FFFFFF', icon: 'PP',   logo: '/banks_1/picpay.svg' },
  { id: 'mercadopago',  name: 'Mercado Pago',         shortName: 'MP',     color: '#00BCFF', textColor: '#FFFFFF', icon: 'MP',   logo: '/banks_1/mercadopago.svg' },
  { id: 'pagbank',      name: 'PagBank',              shortName: 'Pag',    color: '#00A650', textColor: '#FFFFFF', icon: 'Pag',  logo: '/banks_1/pagbank.svg' },
  { id: 'will',         name: 'Will Bank',            shortName: 'Will',   color: '#FFE600', textColor: '#1A1A2E', icon: 'Will' },
  { id: 'sicoob',       name: 'Sicoob',               shortName: 'Sic',    color: '#003B2D', textColor: '#FFFFFF', icon: 'Sic',  logo: '/banks_1/sicoob.svg' },
  { id: 'sicredi',      name: 'Sicredi',              shortName: 'Sicr',   color: '#008C3C', textColor: '#FFFFFF', icon: 'Scr',  logo: '/banks_1/sicredi.svg' },
  { id: 'banrisul',     name: 'Banrisul',             shortName: 'Banr',   color: '#003399', textColor: '#FFFFFF', icon: 'Bnr',  logo: '/banks_1/banrisul.svg' },
  { id: 'original',     name: 'Banco Original',       shortName: 'Orig',   color: '#00A651', textColor: '#FFFFFF', icon: 'Org',  logo: '/banks_1/original.svg' },
  { id: 'safra',        name: 'Banco Safra',          shortName: 'Safra',  color: '#003366', textColor: '#FFFFFF', icon: 'Sfr',  logo: '/banks_1/safra.svg' },
  { id: 'pan',          name: 'Banco Pan',            shortName: 'Pan',    color: '#00ADEF', textColor: '#FFFFFF', icon: 'Pan' },
  { id: 'bmg',          name: 'Banco BMG',            shortName: 'BMG',    color: '#FF6600', textColor: '#FFFFFF', icon: 'BMG',  logo: '/banks_1/bmg.svg' },
  { id: 'daycoval',     name: 'Daycoval',             shortName: 'Day',    color: '#003366', textColor: '#FFFFFF', icon: 'Day',  logo: '/banks_1/daycoval.svg' },
  { id: 'ame',          name: 'Ame Digital',          shortName: 'Ame',    color: '#FF0066', textColor: '#FFFFFF', icon: 'Ame' },
  { id: 'stone',        name: 'Stone',                shortName: 'Stone',  color: '#00A868', textColor: '#FFFFFF', icon: 'Stn',  logo: '/banks_1/stone.svg' },
  { id: 'modal',        name: 'Banco Modal',          shortName: 'Modal',  color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Mdl' },
  { id: 'sofisa',       name: 'Sofisa Direto',        shortName: 'Sof',    color: '#333333', textColor: '#FFFFFF', icon: 'Sof',  logo: '/banks_1/sofisa.svg' },
  { id: 'agibank',      name: 'Agibank',              shortName: 'Agi',    color: '#5B2D8E', textColor: '#FFFFFF', icon: 'Agi' },
  { id: 'digio',        name: 'Digio',                shortName: 'Digio',  color: '#003CFF', textColor: '#FFFFFF', icon: 'Dig' },
  { id: 'rico',         name: 'Rico',                 shortName: 'Rico',   color: '#FF5900', textColor: '#FFFFFF', icon: 'Rico' },
  { id: 'bv',           name: 'Banco BV',             shortName: 'BV',     color: '#003B71', textColor: '#FFFFFF', icon: 'BV',   logo: '/banks_1/bv.svg' },

  // ─── Bancos com logo real ───
  { id: 'abcbrasil',    name: 'ABC Brasil',           shortName: 'ABC',    color: '#003B71', textColor: '#FFFFFF', icon: 'ABC',  logo: '/banks_1/abcbrasil.svg' },
  { id: 'ailos',        name: 'Ailos',                shortName: 'Ailos',  color: '#00A859', textColor: '#FFFFFF', icon: 'Ai',   logo: '/banks_1/ailos.svg' },
  { id: 'arbi',         name: 'Banco Arbi',           shortName: 'Arbi',   color: '#1A3A6B', textColor: '#FFFFFF', icon: 'Ar',   logo: '/banks_1/arbi.svg' },
  { id: 'asaas',        name: 'Asaas',                shortName: 'Asaas',  color: '#0066FF', textColor: '#FFFFFF', icon: 'As',   logo: '/banks_1/asaas.svg' },
  { id: 'banese',       name: 'Banese',               shortName: 'Ban',    color: '#003399', textColor: '#FFFFFF', icon: 'Bn',   logo: '/banks_1/banese.svg' },
  { id: 'banestes',     name: 'Banestes',             shortName: 'Bnst',   color: '#003366', textColor: '#FFFFFF', icon: 'Bs',   logo: '/banks_1/banestes.svg' },
  { id: 'bankofamerica',name: 'Bank of America',      shortName: 'BoA',    color: '#012169', textColor: '#FFFFFF', icon: 'BA',   logo: '/banks_1/bankofamerica.svg' },
  { id: 'banpara',      name: 'Banpara',              shortName: 'Bnpr',   color: '#003399', textColor: '#FFFFFF', icon: 'Bp',   logo: '/banks_1/banpara.svg' },
  { id: 'bancopaulista',name: 'Banco Paulista',       shortName: 'Paul',   color: '#1A3A6B', textColor: '#FFFFFF', icon: 'BP',   logo: '/banks_1/bancopaulista.svg' },
  { id: 'basa',         name: 'Banco da Amazônia',    shortName: 'BASA',   color: '#006400', textColor: '#FFFFFF', icon: 'BA',   logo: '/banks_1/basa.svg' },
  { id: 'beesbank',     name: 'Bees Bank',            shortName: 'Bees',   color: '#FFD100', textColor: '#1A1A2E', icon: 'Be',   logo: '/banks_1/beesbank.svg' },
  { id: 'bib',          name: 'Banco Industrial',     shortName: 'BIB',    color: '#003B71', textColor: '#FFFFFF', icon: 'BI',   logo: '/banks_1/bib.svg' },
  { id: 'bkbank',       name: 'BK Bank',              shortName: 'BK',     color: '#000000', textColor: '#FFFFFF', icon: 'BK',   logo: '/banks_1/bkbank.svg' },
  { id: 'bmp',          name: 'Banco BMP',            shortName: 'BMP',    color: '#1A3A6B', textColor: '#FFFFFF', icon: 'BM',   logo: '/banks_1/bmp.svg' },
  { id: 'bnb',          name: 'Banco do Nordeste',    shortName: 'BNB',    color: '#005799', textColor: '#FFFFFF', icon: 'BN',   logo: '/banks_1/bnb.svg' },
  { id: 'bnpparibas',   name: 'BNP Paribas',          shortName: 'BNP',    color: '#00915A', textColor: '#FFFFFF', icon: 'BN',   logo: '/banks_1/bnpparibas.svg' },
  { id: 'brb',          name: 'BRB',                  shortName: 'BRB',    color: '#004B8D', textColor: '#FFFFFF', icon: 'BRB',  logo: '/banks_1/brb.svg' },
  { id: 'bs2',          name: 'Banco BS2',            shortName: 'BS2',    color: '#003B71', textColor: '#FFFFFF', icon: 'BS2',  logo: '/banks_1/bs2.svg' },
  { id: 'capitual',     name: 'Capitual',             shortName: 'Cap',    color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Ca',   logo: '/banks_1/capitual.svg' },
  { id: 'contasimples', name: 'Conta Simples',        shortName: 'CS',     color: '#1A1A2E', textColor: '#FFFFFF', icon: 'CS',   logo: '/banks_1/contasimples.svg' },
  { id: 'contbank',     name: 'Contbank',             shortName: 'Cont',   color: '#003366', textColor: '#FFFFFF', icon: 'Cb',   logo: '/banks_1/contbank.svg' },
  { id: 'cora',         name: 'Cora',                 shortName: 'Cora',   color: '#FF4785', textColor: '#FFFFFF', icon: 'Co',   logo: '/banks_1/cora.svg' },
  { id: 'credisis',     name: 'Credisis',             shortName: 'Cred',   color: '#003B71', textColor: '#FFFFFF', icon: 'Cr',   logo: '/banks_1/credisis.svg' },
  { id: 'cresol',       name: 'Cresol',               shortName: 'Cres',   color: '#F37021', textColor: '#FFFFFF', icon: 'Cs',   logo: '/banks_1/cresol.svg' },
  { id: 'duepay',       name: 'DuePay',               shortName: 'Due',    color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Du',   logo: '/banks_1/duepay.svg' },
  { id: 'efi',          name: 'Efi Bank',             shortName: 'Efi',    color: '#F37021', textColor: '#FFFFFF', icon: 'Ef',   logo: '/banks_1/efi.svg' },
  { id: 'grafeno',      name: 'Grafeno',              shortName: 'Graf',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Gr',   logo: '/banks_1/grafeno.svg' },
  { id: 'ifoodpago',    name: 'iFood Pago',           shortName: 'iFood',  color: '#EA1D2C', textColor: '#FFFFFF', icon: 'iF',   logo: '/banks_1/ifoodpago.svg' },
  { id: 'infinitepay',  name: 'InfinitePay',          shortName: 'Inf',    color: '#000000', textColor: '#00E676', icon: 'IP',   logo: '/banks_1/infinitepay.svg' },
  { id: 'ip4y',         name: 'Ip4y',                 shortName: 'Ip4y',   color: '#003B71', textColor: '#FFFFFF', icon: 'Ip',   logo: '/banks_1/ip4y.svg' },
  { id: 'iugo',         name: 'Iugo',                 shortName: 'Iugo',   color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Iu',   logo: '/banks_1/iugo.svg' },
  { id: 'letsbank',     name: 'Lets Bank',            shortName: 'Lets',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'LB',   logo: '/banks_1/letsbank.svg' },
  { id: 'linker',       name: 'Linker',               shortName: 'Link',   color: '#00C4B3', textColor: '#FFFFFF', icon: 'Lk',   logo: '/banks_1/linker.svg' },
  { id: 'magalupay',    name: 'MagaluPay',            shortName: 'Mag',    color: '#0086FF', textColor: '#FFFFFF', icon: 'Mg',   logo: '/banks_1/magalupay.svg' },
  { id: 'mercantil',    name: 'Banco Mercantil',      shortName: 'Merc',   color: '#003B71', textColor: '#FFFFFF', icon: 'Me',   logo: '/banks_1/mercantil.svg' },
  { id: 'modobank',     name: 'ModoBank',             shortName: 'Modo',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Mo',   logo: '/banks_1/modobank.svg' },
  { id: 'mufg',         name: 'MUFG',                 shortName: 'MUFG',   color: '#DA291C', textColor: '#FFFFFF', icon: 'MU',   logo: '/banks_1/mufg.svg' },
  { id: 'multiplo',     name: 'Multiplo Bank',        shortName: 'Mult',   color: '#1A3A6B', textColor: '#FFFFFF', icon: 'Mt',   logo: '/banks_1/multiplo.svg' },
  { id: 'omie',         name: 'Omie.Cash',            shortName: 'Omie',   color: '#003366', textColor: '#FFFFFF', icon: 'Om',   logo: '/banks_1/omie.svg' },
  { id: 'omni',         name: 'Omni',                 shortName: 'Omni',   color: '#003B71', textColor: '#FFFFFF', icon: 'On',   logo: '/banks_1/omni.svg' },
  { id: 'paycash',      name: 'PayCash',              shortName: 'Pay',    color: '#00A650', textColor: '#FFFFFF', icon: 'PC',   logo: '/banks_1/paycash.svg' },
  { id: 'pinbank',      name: 'PinBank',              shortName: 'Pin',    color: '#FF6600', textColor: '#FFFFFF', icon: 'Pi',   logo: '/banks_1/pinbank.svg' },
  { id: 'pine',         name: 'Banco Pine',           shortName: 'Pine',   color: '#003366', textColor: '#FFFFFF', icon: 'Pe',   logo: '/banks_1/pine.svg' },
  { id: 'quality',      name: 'Quality Digital',      shortName: 'Qual',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Qd',   logo: '/banks_1/quality.svg' },
  { id: 'recargapay',   name: 'RecargaPay',           shortName: 'Rec',    color: '#FF6600', textColor: '#FFFFFF', icon: 'RP',   logo: '/banks_1/recargapay.svg' },
  { id: 'rendimento',   name: 'Banco Rendimento',     shortName: 'Rend',   color: '#003366', textColor: '#FFFFFF', icon: 'Rd',   logo: '/banks_1/rendimento.svg' },
  { id: 'sisprime',     name: 'Sisprime',             shortName: 'Sis',    color: '#003B2D', textColor: '#FFFFFF', icon: 'Sp',   logo: '/banks_1/sisprime.svg' },
  { id: 'squid',        name: 'Squid',                shortName: 'Sqd',    color: '#6C3BF5', textColor: '#FFFFFF', icon: 'Sq',   logo: '/banks_1/squid.svg' },
  { id: 'starbank',     name: 'StarBank',             shortName: 'Star',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'SB',   logo: '/banks_1/starbank.svg' },
  { id: 'sulcredi',     name: 'Sulcredi',             shortName: 'Sulc',   color: '#003B2D', textColor: '#FFFFFF', icon: 'Sl',   logo: '/banks_1/sulcredi.svg' },
  { id: 'topazio',      name: 'Banco Topazio',        shortName: 'Top',    color: '#003B71', textColor: '#FFFFFF', icon: 'Tz',   logo: '/banks_1/topazio.svg' },
  { id: 'transfera',    name: 'Transfeera',           shortName: 'Trf',    color: '#00A859', textColor: '#FFFFFF', icon: 'Tf',   logo: '/banks_1/transfera.svg' },
  { id: 'tribanco',     name: 'Tribanco',             shortName: 'Trib',   color: '#003B71', textColor: '#FFFFFF', icon: 'Tb',   logo: '/banks_1/tribanco.svg' },
  { id: 'unicred',      name: 'Unicred',              shortName: 'Unic',   color: '#00A859', textColor: '#FFFFFF', icon: 'Uc',   logo: '/banks_1/unicred.svg' },
  { id: 'uniprime',     name: 'Uniprime',             shortName: 'Uni',    color: '#003B2D', textColor: '#FFFFFF', icon: 'Up',   logo: '/banks_1/uniprime.svg' },
  { id: 'zemobank',     name: 'Zemo Bank',            shortName: 'Zemo',   color: '#1A1A2E', textColor: '#FFFFFF', icon: 'Zm',   logo: '/banks_1/zemobank.svg' },

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
