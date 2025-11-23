export const formatDateToBrazilianFormat = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

export const formatDateToAmericanFormat = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}