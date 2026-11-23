# Introducción a los espacios métricos

## 1. Definición

Un espacio métrico es un conjunto equipado con una función de distancia.

Sea \(X\) un conjunto no vacío. Una métrica es una función:

$$
d:X\times X\rightarrow\mathbb{R}
$$

Que cumple las siguientes propiedades:

### 1.1. No negatividad

$$
d(x,y)\geq 0
$$

### 1.2. Identidad de los indiscernibles

$$
d(x,y)=0\iff x=y
$$

### 1.3. Simetría

$$
d(x,y)=d(y,x)
$$

### 1.4. Desigualdad triangular

$$
d(x,z)\leq d(x,y)+d(y,z)
$$

## 2. Ejemplo en los números reales

La métrica usual en los números reales se define como:

$$
d(x,y)=|x-y|
$$

## 3. Implementación en Python

```python
def distancia(x, y):
    return abs(x - y)

print(distancia(5, 2))
```

## 4. Conclusión

Los espacios métricos permiten generalizar la noción de distancia y constituyen una herramienta fundamental del análisis matemático.
