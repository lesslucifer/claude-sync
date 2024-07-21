export const selectFile = () => {
    return new Promise<File>((res) => {
        const input = document.createElement('input');
        input.type = 'file';
    
        input.onchange = async (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const file = files[0];
                res(file)
            }
        };
    
        input.click();
    })
};