import {
  Box,
  Flex,
  Grid,
  IconButton,
  Link,
  Heading,
} from '@chakra-ui/react';
import { FiBookmark, FiSettings } from 'react-icons/fi';
import NextLink from 'next/link';

export function NavBar() {
  return (
    <Grid
      as="header"
      position="sticky"
      top="0"
      insetX="0"
      h={{ base: '56px', md: '64px' }}
      px={{ base: 3, md: 6 }}
      templateColumns="auto 1fr auto"
      alignItems="center"
      bg="var(--chakra-colors-bg)"              /* adapts to color‑mode via CSS var */
      borderBottom="1px solid var(--chakra-colors-border)"
      zIndex="banner"
    >
      {/* 1 ▸ LEFT slot — bookmark icon on mobile, invisible placeholder on desktop */}
      <LeftPad />

      {/* 2 ▸ CENTRE — cursive, lowercase title */}
      <Heading
        as="h1"
        fontFamily="'Pacifico', cursive"
        fontSize={{ base: 'lg', md: 'xl' }}
        textTransform="lowercase"
        textAlign="center"
        lineHeight="1"
      >
        dreamscroll
      </Heading>

      {/* 3 ▸ RIGHT slot — settings icon (always) + bookmark on desktop */}
      <Flex justify="flex-end" gap="2">
        {/* show the bookmark here only ≥ md */}
        <NavIcon
          href="/saved"
          label="Saved posts"
          icon={<FiBookmark />}
          display={{ base: 'none', md: 'inline-flex' }}
        />
        <NavIcon
          href="/settings"
          label="Settings"
          icon={<FiSettings />}
        />
      </Flex>
    </Grid>
  );
}

/* ---------- left area helper ---------- */
/* On mobile we show the bookmark; on desktop we render an empty 40 px box
   so the centre title stays perfectly centred without JS measuring. */
function LeftPad() {
  return (
    <>
      <NavIcon
        href="/saved"
        label="Saved posts"
        icon={<FiBookmark />}
        display={{ base: 'inline-flex', md: 'none' }}
      />
      <Box w="40px" display={{ base: 'none', md: 'block' }} />
    </>
  );
}

/* ---------- generic icon‑link helper ---------- */
interface NavIconProps {
  href: string;
  label: string;
  icon: React.ReactElement;
  display?: Record<string, string>;
}
function NavIcon({ href, label, icon, display }: NavIconProps) {
  return (
    <Link
      as={NextLink}
      href={href}
      _focusVisible={{ boxShadow: 'outline' }}
      display={display}
    >
      <IconButton
        aria-label={label}
        variant="ghost"
        size="md"
        minW="40px"
      >{icon}</IconButton>
    </Link>
  );
}
