import { Box, Heading, VStack } from '@chakra-ui/react';
import CreateGeneratorForm from './CreateGeneratorForm';
import GeneratorCard from './GeneratorCard';
import { listGenerators } from './actions';

/* ---------------------------------------------------------------- *
 *  This file is a **pure server component** (no 'use client').     *
 *  It streams the HTML for the list; the child cards hydrate only  *
 *  where needed.                                                   *
 * ---------------------------------------------------------------- */
export const metadata = { title: 'Generators' };

export default async function GeneratorsPage() {
  const generators = await listGenerators();

  return (
    <Box p={6} maxW="6xl" mx="auto">
      <Heading mb={8}>Generators</Heading>

      <CreateGeneratorForm />

      <VStack align="stretch" gap={6}>
        {generators.map((g) => (
          <GeneratorCard key={g.id} g={g} />
        ))}
      </VStack>
    </Box>
  );
}

