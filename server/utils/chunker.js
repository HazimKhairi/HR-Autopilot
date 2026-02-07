function chunkText(text,{
    chunkSize = 800,
    overlap = 200
} = {}){
    //split sentences followed by space or end
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const chunks = [];
    let currentChunks = '';

    for (const sentence of sentences){
        //if this sentence more than chunk size , save current chunk
        if (currentChunks.length + sentence.length > chunkSize && currentChunks.length > 0){
            chunks.push(currentChunks.trim());

            const overlapText = currentChunks.slice(-overlap);
            currentChunks = overlapText + sentence;
        } else{
            currentChunks += sentence;
        }
    }

    if(currentChunks.trim().length > 0){
        chunks.push(currentChunks.trim());
    }

    return chunks; 
}

module.exports = {chunkText}