import {uniqueNamesGenerator, adjectives, animals} from 'unique-names-generator';

export const generateUniqueName = () => {
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: '-',
        style: 'capital'
    });

    return uniqueName;
}
export const generateUniqueNameWithPrefix = (prefix) => {
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: '-',
        style: 'capital'
    });

    return `${prefix}-${uniqueName}`;
}
export const generateUniqueNameWithSuffix = (suffix) => {
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: '-',
        style: 'capital'
    });

    return `${uniqueName}-${suffix}`;
}
export const generateUniqueNameWithPrefixAndSuffix = (prefix, suffix) => {
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: '-',
        style: 'capital'
    });

    return `${prefix}-${uniqueName}-${suffix}`;
}