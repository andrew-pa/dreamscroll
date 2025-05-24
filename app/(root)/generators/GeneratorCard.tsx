'use client';

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Flex,
  Field,
  Heading,
  IconButton,
  Input,
  Text,
  Textarea,
  HStack,
} from '@chakra-ui/react';
import { FiTrash } from 'react-icons/fi';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GeneratorRecord } from '@/lib/repositories/generatorRepository';
import { updateGenerator, deleteGenerator } from './actions';
import { toaster } from '@/components/ui/toaster';

export default function GeneratorCard({ g }: { g: GeneratorRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(g.name);
  const [configText, setConfigText] = useState(
    JSON.stringify(g.config, null, 2),
  );


  const {parsedOk, parseError} = useMemo(() => {
    try {
      JSON.parse(configText);
      return {parsedOk: true};
    } catch(e: any) {
      return {parsedOk: false, parseError: e.toString()};
    }
  }, [configText]);

  const dirty =
    name.trim() !== g.name ||
    configText !== JSON.stringify(g.config, null, 2);

  /* ---- actions ---- */
  const save = () =>
    startTransition(async () => {
      await updateGenerator(g.id, name.trim(), JSON.parse(configText));
      toaster.create({ type: 'success', description: `Saved “${name.trim()}”` });
      router.refresh();
    });

  const destroy = () => {
    if (!confirm(`Delete generator “${g.name}”?`)) return;
    startTransition(async () => {
      await deleteGenerator(g.id);
      toaster.create({ type: 'info', description: `Deleted “${g.name}”` });
      router.refresh();
    });
  };

  return (
    <Card.Root>
      <CardHeader>
        <HStack align="center" gap={4} justify="space-between">
          <Heading size="sm">#{g.id}</Heading>
          <IconButton
            aria-label="Delete generator"
            variant="ghost"
            colorScheme="red"
            onClick={destroy}
          ><FiTrash/></IconButton>
        </HStack>
      </CardHeader>

      <Card.Body display="flex" flexDirection="column" gap={4}>
        <Text>
          <strong>Type:</strong> {g.type}
        </Text>

        <Text>
          <strong>Last run:</strong>{' '}
          {g.lastRun ? g.lastRun.toLocaleString() : 'never'}
        </Text>

        <Field.Root required>
          <Field.Label>Name</Field.Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field.Root>

        <Field.Root invalid={!parsedOk}>
          <Field.Label>Config (JSON)</Field.Label>
          <Textarea
            rows={8}
            fontFamily="mono"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
          />
          <Field.ErrorText>Invalid JSON: {parseError}</Field.ErrorText>
        </Field.Root>
      </Card.Body>

      <Card.Footer>
          {dirty && (
            <Button
              colorScheme="teal"
              onClick={save}
              disabled={!parsedOk}
              loading={isPending}
            >
              Save
            </Button>
          )}
      </Card.Footer>
    </Card.Root>
  );
}

