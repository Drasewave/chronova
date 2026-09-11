import type { SVGProps } from "react";

/**
 * Jeu de pictos maison : grille 24, trait 1,5 px, extrémités droites,
 * `currentColor`, aucun remplissage. Un seul style sur tout le site.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconFleche = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Icon>
);

export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 9.5 12 15.5l6-6" />
  </Icon>
);

export const IconCroix = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 7h18M3 12h18M3 17h18" />
  </Icon>
);

export const IconPanier = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h16l-1.4 12H5.4z" />
    <path d="M9 7V5.5A3 3 0 0 1 15 5.5V7" />
  </Icon>
);

export const IconCompte = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20c1.3-3.8 4-5.7 7.5-5.7s6.2 1.9 7.5 5.7" />
  </Icon>
);

export const IconEtancheite = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3.5c3.4 4 5.5 6.9 5.5 9.6A5.5 5.5 0 0 1 12 20a5.5 5.5 0 0 1-5.5-6.9c0-2.7 2.1-5.6 5.5-9.6Z" />
  </Icon>
);

export const IconMouvement = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

export const IconTournevis = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14.5 3.5 20.5 9.5 17 13l-6-6z" />
    <path d="m11 7-7.5 7.5L3 20.5l6-.5L16.5 12.5" />
  </Icon>
);

export const IconColis = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" />
    <path d="M4 8.5 12 13l8-4.5M12 13v7" />
  </Icon>
);
