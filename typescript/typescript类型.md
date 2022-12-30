# TypeScript

## 类型体操总结

### 模式匹配做提取
可以通过匹配一个模式类型来提取部分类型到 `infer` 声明的局部变量中返回

### 重新构造做变换

### 递归复用做循环

### 数组长度做计数

### 联合分散可简化

### 特殊特性要记清

## 内置高级类型

### Parameters 提取函数类型的参数类型

### ReturnType 提取函数类型的返回值类型

### ConstructorParameters 提取构造器的参数类型
```js
type ConParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never
```

### InstanceType 提取构造器的返回类型

### ThisParameterType 提取函数参数中的this类型

### OmitThisParameter 去掉 this 类型构造新的函数类型

### Partial 将索引变为可选
```ts
type Partial<T> = {
    [P in keyof T]?: T[P];
};
```

### Required 去掉可选
```ts
type Required<T> = {
    [P in keyof T]-?: T[P];
};
```

### Readonly 添加readonly修饰

### Pick 索引过滤
```ts
type Pick<T, Key extends keyof T> = {
    [P in Key]: T[P];
};
```

### Omit 去掉这部分索引构造成新的索引类型
```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### Record 创建索引类型
```ts
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```
**`keyof any`  =  `string | number | symbol`**

**`Record<string, number>` 返回 可索引签名 `{ [x:string]: number }`**

### Exclude 联合类型中去除一部分类型 取差集

### Extract 联合类型中保留一部分类型 取交集

### Awaited 取出Promise 的值的类型

### NonNullable 判断是否为非空类型 （不是null或者undefined）
```ts
type NonNullable<T> = T extends null | undefined ? never : T;
```

### Uppercase大写、Lowercase小写、Capitalize首字母大写、Uncapitalize去掉首字母大写

## 运算符
### & 交叉类型
交叉类型试讲多个类型合并为一个类型，通过这个运算符可以将现有的多种类型叠加到一起成为一种类型，这个类型包含了所有类型的特性

## 类型编程的意义

## 函数重载三种写法

### 直接声明的方式
```ts
declare function func(name: string): string;
declare function func(name: number): number;
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any) {
    return a + b;
}
```

### interface方式
```ts
interface Func{
    (name: string): string;
    (name: number): number;
}
```

### 交叉类型
```ts
type Func = ((name: string) => string) & ((name: number) => number)
```

**`函数重载返回的值类型是最后一个重载的返回值类型`**

### 联合转交叉
实现依据： **TS中有函数参数是有`逆变`性质的，如果参数可能是多个类型，参数类型会变成他们交叉类型**

- 逆变：允许父类型赋值给子类型
- 协变：允许子类型赋值给父类型

具体实现：
```ts
type UnionToIntersection<U> = 
    (U extends U ? (x: U) => unknown : never) extends (x: infer R) => unknown
        ? R
        : never
```

### 联合转元组
实现依据：利用函数参数的逆变性质，将`联合类型转交叉`，然后根据函数重载的性质，将返回的交叉类型`封装成函数重载`，最后可以通过`ReturnType`返回最后一个重载的返回值，也就是最初联合类型的最后一个元素。通过递归重构的方式最后可以得到对应的元祖
```ts
type UnionTurple<U> = 
    UnionToIntersection<U extends any ? () => U : never> 
    extends () => infer ReturnType ? 
    [...UnionTurple<Exclude<U,ReturnType>>, ReturnType] : []
type TestU = UnionTurple<'1'|'2'|'3'> // ['1','2'.'3']
```

## infer匹配模式
- 存在的问题：
**通过`infer`提取出的元素，默认会推导成`unknown`类型，这样就导致了不能直接对它做一些特定类型的操作，比如字符串拼接**
- 解决的方法
  1. 可以在操作之前再做一层特定类型的判断
  2. 使用交叉`&`
  3. 4.7新语法 **`infer extends`**
     4.7推导出的是extends约束的类型，但是4.8，如果是基础类型，会推导出字面量类型
```ts
type NumInfer<Str> = 
    Str extends `${infer Num extends number}`
        ? Num
        : never;
type res = NumInfer<'123'>
// 4.7 type res = number
// 4.8 type res = 123
```

### infer extends 作用 - 枚举的值类型可以保留原来的类型 - 类型转换（数字、boolean、null等）（之前会变成字符串）

```ts
enum Code {
    a = 1,
    b = 2,
    c = 'ee'
}
type code = `${Code}` // "1"|"2"|"ee"
type StrToNum<Str> = Str extends `${infer Num extends number}` ? Num : Str
type TCode = StrToNum<`${Code}`> // "ee"|1|2
```





## 类型安全和型变
### 型变
#### 协变 - 子类型可以赋值给父类型
#### 逆变 - 父类型可以赋值给子类型

**ts 加了一个编译选项 `strictFunctionTypes`，设置为 `true` 就只支持`函数参数的逆变`，设置为 `false` 则是`双向协变`**

## tsc和babel编译的区别
- tsc 生成的代码没有做 `polyfill` 的处理，需要`全量引入 core-js`，而 babel 则可以用 `@babel/preset-env` 根据 targets 的配置来`按需引入 core-js` 的部分模块，所以生成的代码体积更小。
- `babel 是每个文件单独编译的，而 tsc 不是，tsc 是整个项目一起编译`，会处理类型声明文件，会做跨文件的类型声明合并，比如 namespace 和 interface 就可以跨文件合并。
- babel `const enum 不支持`<br>
  const enum 编译之后是直接替换用到 enum 的地方为对应的值
  ```ts
    const enum Person {
        Dong = 'dong',
        Guang = 'guang'
    }
    console.log(Person.Dong) // console.log("dong")
  ```
  const enum 是在编译期间把 enum 的引用替换成具体的值，需要解析类型信息，而 babel 并不会解析，所以它会把 const enum 转成 enum 来处理
- babel, namespace 部分支持：不支持 namespace 的合并，不支持导出非 const 的值
- babel, 部分语法不支持 像 export = import = 这种过时的模块语法并不支持

## 基于 babel 来实现类型检查


