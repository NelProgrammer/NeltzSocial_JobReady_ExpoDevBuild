// @ts-nocheck
export interface MasterItemBase {
    id: string;
    updatedAt: string;     // ISO 8601 UTC String: "2026-08-11T19:20:00.000Z"
    updatedAtMs: number;   // Unix Epoch MS: 1786476000000 (1:1 DB mapping)
    deletedAt?: string;    // Soft-deletion timestamp for sync tombstoning
    version?: number;
}

export interface ItemConflict<T extends MasterItemBase> {
    id: string;
    fieldName: string; // 'experience' | 'tertiary' | 'skills' | 'references'
    localItem: T;
    remoteItem: T;
}

export interface ArrayMergeResult<T extends MasterItemBase> {
    merged: T[];
    conflicts: ItemConflict<T>[];
}

/**
 * Merge two timestamped arrays of items (Experience, Skills, Education, References)
 * using fine-grained Last-Write-Wins and item-level conflict detection.
 */
export const mergeItemArray = <T extends MasterItemBase>(
    fieldName: string,
    localArray: T[] = [],
    remoteArray: T[] = []
): ArrayMergeResult<T> => {
    const mergedMap = new Map<string, T>();
    const conflicts: ItemConflict<T>[] = [];
    const remoteMap = new Map<string, T>();

    (remoteArray || []).forEach((item) => {
        if (item && item.id) {
            remoteMap.set(item.id, item);
        }
    });

    const processedIds = new Set<string>();

    (localArray || []).forEach((localItem) => {
        if (!localItem || !localItem.id) return;
        const id = localItem.id;
        processedIds.add(id);

        const remoteItem = remoteMap.get(id);

        if (!remoteItem) {
            // Exists only in local
            if (!localItem.deletedAt) {
                mergedMap.set(id, localItem);
            }
        } else {
            // Exists in both local and remote
            const localMs = localItem.updatedAtMs || (localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0);
            const remoteMs = remoteItem.updatedAtMs || (remoteItem.updatedAt ? new Date(remoteItem.updatedAt).getTime() : 0);

            // Check for soft deletions
            const localDeleted = localItem.deletedAt ? new Date(localItem.deletedAt).getTime() : 0;
            const remoteDeleted = remoteItem.deletedAt ? new Date(remoteItem.deletedAt).getTime() : 0;

            if (localDeleted > 0 || remoteDeleted > 0) {
                // Soft deleted item
                if (localDeleted >= localMs && localDeleted >= remoteMs) return;
                if (remoteDeleted >= localMs && remoteDeleted >= remoteMs) return;
            }

            const delta = Math.abs(localMs - remoteMs);
            const localStr = JSON.stringify(localItem);
            const remoteStr = JSON.stringify(remoteItem);

            if (delta <= 100 && localStr !== remoteStr) {
                // Concurrent collision within same timestamp window
                conflicts.push({
                    id,
                    fieldName,
                    localItem,
                    remoteItem
                });
                // Temporarily pick local until user resolves
                mergedMap.set(id, localItem);
            } else if (localMs >= remoteMs) {
                mergedMap.set(id, localItem);
            } else {
                mergedMap.set(id, remoteItem);
            }
        }
    });

    // Process remote items not present in local
    (remoteArray || []).forEach((remoteItem) => {
        if (!remoteItem || !remoteItem.id) return;
        if (!processedIds.has(remoteItem.id)) {
            if (!remoteItem.deletedAt) {
                mergedMap.set(remoteItem.id, remoteItem);
            }
        }
    });

    return {
        merged: Array.from(mergedMap.values()),
        conflicts
    };
};

/**
 * Merge entire CV data payload with fine-grained item array merging and conflict detection
 */
export const mergeCvPayloads = (localCv: any, remoteCv: any) => {
    const allConflicts: ItemConflict<any>[] = [];

    // Merge Work Experience
    const expResult = mergeItemArray('experience', localCv?.experience || [], remoteCv?.experience || []);
    allConflicts.push(...expResult.conflicts);

    // Merge Tertiary Education
    const localEdu = localCv?.education?.tertiary || [];
    const remoteEdu = remoteCv?.education?.tertiary || [];
    const eduResult = mergeItemArray('tertiary', localEdu, remoteEdu);
    allConflicts.push(...eduResult.conflicts);

    // Merge Skills
    const localSkills = localCv?.Skills || localCv?.skills?.items || [];
    const remoteSkills = remoteCv?.Skills || remoteCv?.skills?.items || [];
    const skillsResult = mergeItemArray('skills', localSkills, remoteSkills);
    allConflicts.push(...skillsResult.conflicts);

    // Merge References
    const refResult = mergeItemArray('references', localCv?.references || [], remoteCv?.references || []);
    allConflicts.push(...refResult.conflicts);

    const mergedCv = {
        ...(remoteCv?.updatedAtMs > localCv?.updatedAtMs ? remoteCv : localCv),
        experience: expResult.merged,
        education: {
            ...(localCv?.education || remoteCv?.education || {}),
            tertiary: eduResult.merged
        },
        Skills: skillsResult.merged,
        references: refResult.merged
    };

    return {
        mergedCv,
        conflicts: allConflicts
    };
};
