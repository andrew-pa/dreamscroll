"use client";

import {
    Button,
    Card,
    Field,
    HStack,
    Heading,
    Input,
    NativeSelect,
} from "@chakra-ui/react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    GENERATOR_TYPES,
    GeneratorType,
} from "@/lib/repositories/generatorRepository";
import { createGenerator } from "./actions";
import { toaster } from "@/components/ui/toaster";

export default function CreateGeneratorForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState("");
    const [type, setType] = useState<GeneratorType>(GENERATOR_TYPES[0]);

    const submit = () =>
        startTransition(async () => {
            if (!name.trim()) {
                toaster.create({
                    type: "warning",
                    description: "Name is required",
                });
                return;
            }
            await createGenerator(name.trim(), type);
            toaster.create({
                type: "success",
                description: "Generator created",
            });
            setName("");
            setType(GENERATOR_TYPES[0]);
            router.refresh();
        });

    return (
        <Card.Root mb={10}>
            <Card.Header>
                <Heading size="md">Create new generator</Heading>
            </Card.Header>
            <Card.Body>
                <HStack flexWrap="wrap" gap={4}>
                    <Field.Root required>
                        <Field.Label>Name</Field.Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </Field.Root>

                    <Field.Root required>
                        <Field.Label>Type</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field
                                value={type}
                                onChange={e =>
                                    setType(
                                        e.currentTarget.value as GeneratorType,
                                    )
                                }
                            >
                                {GENERATOR_TYPES.map(t => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                        </NativeSelect.Root>
                    </Field.Root>
                </HStack>
            </Card.Body>
            <Card.Footer>
                <Button
                    colorScheme="teal"
                    onClick={submit}
                    loading={isPending}
                    loadingText="Creating"
                >
                    Create
                </Button>
            </Card.Footer>
        </Card.Root>
    );
}
