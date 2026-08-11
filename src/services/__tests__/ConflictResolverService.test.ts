// @ts-nocheck
import { mergeItemArray, mergeCvPayloads } from '../ConflictResolverService';

describe('ConflictResolverService Fine-Grained Array Merging', () => {
    test('merges local and remote arrays cleanly using timestamp LWW', () => {
        const localExp = [
            { id: 'exp_1', Role: 'Senior Dev', updatedAt: '2026-08-11T19:00:00.000Z', updatedAtMs: 1000 },
            { id: 'exp_2', Role: 'Frontend Dev', updatedAt: '2026-08-11T19:10:00.000Z', updatedAtMs: 2000 }
        ];

        const remoteExp = [
            { id: 'exp_1', Role: 'Lead Dev', updatedAt: '2026-08-11T19:05:00.000Z', updatedAtMs: 1500 }, // Remote newer
            { id: 'exp_3', Role: 'Junior Dev', updatedAt: '2026-08-11T18:00:00.000Z', updatedAtMs: 500 }
        ];

        const result = mergeItemArray('experience', localExp, remoteExp);

        expect(result.merged.length).toBe(3);
        const exp1 = result.merged.find(i => i.id === 'exp_1');
        expect(exp1.Role).toBe('Lead Dev'); // Accepted remote because 1500 > 1000
        const exp2 = result.merged.find(i => i.id === 'exp_2');
        expect(exp2.Role).toBe('Frontend Dev');
        const exp3 = result.merged.find(i => i.id === 'exp_3');
        expect(exp3.Role).toBe('Junior Dev');
    });

    test('detects item-level collisions when timestamps match within 100ms', () => {
        const localSkills = [
            { id: 'sk_1', name: 'React Native', updatedAtMs: 5000 }
        ];
        const remoteSkills = [
            { id: 'sk_1', name: 'React Native & TypeScript', updatedAtMs: 5000 }
        ];

        const result = mergeItemArray('skills', localSkills, remoteSkills);

        expect(result.conflicts.length).toBe(1);
        expect(result.conflicts[0].id).toBe('sk_1');
        expect(result.conflicts[0].fieldName).toBe('skills');
    });
});
