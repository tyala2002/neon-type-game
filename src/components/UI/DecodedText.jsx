import React, { useEffect, useState } from 'react';

const DecodedText = ({ value, duration = 1000, className = "" }) => {
    const [displayValue, setDisplayValue] = useState("");
    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";

    useEffect(() => {
        let startTime;
        let animationFrame;
        const finalValue = String(value);

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            if (progress < duration) {
                let currentText = "";
                for (let i = 0; i < finalValue.length; i++) {
                    // As progress increases, more characters become fixed
                    if (i < (progress / duration) * finalValue.length) {
                        currentText += finalValue[i];
                    } else {
                        currentText += characters[Math.floor(Math.random() * characters.length)];
                    }
                }
                setDisplayValue(currentText);
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(finalValue);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span className={className}>{displayValue}</span>;
};

export default DecodedText;
