// 匹配数组
type getLast<Arra extends unknown[]> = Arra extends [...unknown[], infer last] ? last : never
type last = getLast<[1, 2, 3]>

type getFirst<Arra extends unknown[]> = Arra extends [infer first, ...unknown[]] ? first : never
type first = getFirst<[1, 2, 3]>

type getMiddles<Arra extends unknown[]> = Arra extends [] ? [] : Arra extends [unknown, ...infer middles, unknown] ? middles : never
type middles = getMiddles<[]>

// 匹配字符串前缀
type StartWith<Str extends string, prefix extends string> = Str extends `${prefix}${string}` ? true : false
type isStartWith = StartWith<'go go doing', 'go'>

// 字符串匹配替换
type ReplaceWith<Str extends string, From extends string, To extends string> = Str extends `${infer prefix}${From}${infer suffix}` ? `${prefix}${To}${suffix}` : Str
type isReplaceWith = ReplaceWith<'She is my friend ?', '?', 'Sara'>

// 去掉前后空白字符 (用到了递归)
type TrimRight<Str extends string> = Str extends `${infer Rest}${' ' | '\n' | '\t'}` ? TrimRight<Rest> : Str
type TrimLeft<Str extends string> = Str extends `${' ' | '\n' | '\t'}${infer Rest}` ? TrimLeft<Rest> : Str
type TrimAll<Str extends string> = TrimRight<TrimLeft<Str>>
type TestTrim = TrimAll<' wswsd '>

// 函数参数提取类型
type GetParam<Fun extends Function> = Fun extends (...args: infer Args) => unknown ? Args : never
type getParamResult = GetParam<(name: string, age: number) => string>
type getParamResultVoid = GetParam<() => string>

// 函数提取返回值类型
type GetReturn<Fun extends Function> = Fun extends (...args: any[]) => infer ReturnType ? ReturnType : never
type getReturn = GetReturn<() => 'hi'>

// this
class Doing {
    name: string;
    constructor() {
        this.name = 'aaaaa'
    }
    hello(this: Doing) {
        console.log(this.name)
    }
}
const doing = new Doing()
doing.hello()
type GetThisType<T> = T extends (this: infer ThisType, ...args: any[]) => any ? ThisType : unknown
type result = GetThisType<typeof doing.hello>

// 构造参数和返回值类型
type GetConParamType<Con extends new (...args: any) => any> = Con extends new (...args: infer ParamType) => any ? ParamType : unknown
type GetConReturnType<Con extends new (...args: any) => any> = Con extends new (...args: any) => infer InstanceType ? InstanceType : unknown

// props ref
type GetRefProp<Props> =
    'ref' extends keyof Props
    ? Props extends { ref?: infer value | undefined }
    ? value
    : never
    : never


// 递归
// 数组递归
// 反转
type ReverseArr<Arr extends unknown[]> = Arr extends [infer First, ...infer Rest] ? [...ReverseArr<Rest>, First] : Arr
type TestReverse = ReverseArr<[1, 2, 3, 4, 5]>
// includes查找
type IsEqual<A, B> = (A extends B ? true : false) & (B extends A ? true : false)
type IncludeArr<Arr extends unknown[], FindItem> = Arr extends [infer First, ...infer Rest]
    ? IsEqual<First, FindItem> extends true
    ? true : IncludeArr<Rest, FindItem>
    : false
// 对象递归
type DeepReadonly<Obj extends Record<string, any>> = {
    readonly [Key in keyof Obj]: Obj[Key] extends Object
    ? Obj[Key] extends Function
    ? Obj[Key] : DeepReadonly<Obj[Key]>
    : Obj[Key]
}
type TestDeep = DeepReadonly<{ a: { b: { c: 1 } } }>

// ts类型只有被用的时候才会计算，如果想要触发计算，可以在前面加一段 Obj extends never ? never 或者 Obj extends any
type DeepReadonlyA<Obj extends Record<string, any>> =
    Obj extends any ? {
        readonly [Key in keyof Obj]: Obj[Key] extends Object
        ? Obj[Key] extends Function
        ? Obj[Key] : DeepReadonlyA<Obj[Key]>
        : Obj[Key]
    }
    : never

type TestDeepA = DeepReadonlyA<{ a: { b: { c: 1 } } }>

// Tip1 在类型体操中 遇到数量不确定的问题 要条件反射的想到递归

// 数组长度做计数
// TS中没有加减乘除运算符，但是可以通过构造不同数组然后取length的方式来完成数值的计算，把数值的加减乘除变成对数组的提取和构造

type BuildArray<Length extends number, Ele = unknown, Arr extends unknown[] = []> = Arr['length'] extends Length
    ? Arr : BuildArray<Length, Ele, [...Arr, Ele]>

// 加
type Add<Num1 extends number, Num2 extends number> = [...BuildArray<Num1>, ...BuildArray<Num2>]['length']
type TestAdd = Add<1, 2>

// 减
type Subtract<Num1 extends number, Num2 extends number> = BuildArray<Num1> extends [...BuildArray<Num2>, ...infer Rest]
    ? Rest['length'] : never
type TestSubtract = Subtract<5, 2>

// 乘
type Mutiply<Num1 extends number, Num2 extends number, ResultArr extends unknown[] = []> = Num2 extends 0
    ? ResultArr['length'] : Mutiply<Num1, Subtract<Num2, 1>, [...BuildArray<Num1>, ...ResultArr]>
type TestMutiply = Mutiply<6, 4>

// 除
type Devide<Num1 extends number, Num2 extends number, ResultArr extends unknown[] = []> = Num1 extends 0
    ? ResultArr['length'] : Devide<Subtract<Num1, Num2>, Num2, [unknown, ...ResultArr]>
type TestDevide = Devide<6, 2>

// 联合分散可简化

// 分布式条件类型：当类型参数为联合类型，并且在条件类型左边直接引用该类型参数的时候，TS会把每个元素单独传入来做类型运算，最后再合并成联合类型

// 实现Union类型的判断，可以充分利用上面联合类型的特性
// 其中  A extends A 主要是为了触发分布式条件类型，这样因为条件类型中如果左边是联合类型，会把每个元素单独传入做计算，但是右边不会
// [B] extends [A] 这样写是为了避免B触发分布式条件类型，那么B就是整个联合类型
// 这样判断下来，B是联合类型整体，而A是单个类型，自然不成立，但是其他非联合类型都没有这种特殊处理，所以就会成立
type IsUnion<A, B = A> = A extends A
    ? [B] extends [A]
    ? false : true
    : never

// 特殊类型的特性(联合类型、never、any、元组)
// 判断不了any
type IsEqual1<A, B> = (A extends B ? true : false) & (B extends A ? true : false);
type IsEqual2<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true : false;

type TestAny<T> = T extends number ? 1 : 2;
type TestAnyRes = TestAny<any>; // 1|2

// 元组类型的 length 是数字字面量，而数组的 length 是 number

// 逆变和协变

// 如何提取索引类型中的可选索引
// 实现的方式：单独取出构造新的索引类型，然后判断空对象是否是它的子类型
type GetOptional<Obj extends Record<string, any>> = {
    [
    Key in keyof Obj
    as {} extends Pick<Obj, Key> ? Key : never
    ]: Obj[Key]
}

type GetRequired<Obj extends Record<string, any>> = {
    [
    Key in keyof Obj
    as {} extends Pick<Obj, Key> ? never : Key
    ]: Obj[Key]
}

type TestOptional = GetOptional<{
    a: string,
    b?: number
}>

type TestRequired = GetRequired<{
    a: string,
    b?: number
}>

// 索引签名不能构造成字符串字面量类型，因为它没有名字，而其他索引是可以的 Key extends `${infer Str}`
// keyof 只能拿到 class 的 public 的索引，可以用来过滤出 public 的属性。
// 默认推导出来的不是字面量类型，加上 as const 可以推导出字面量类型，但带有 readonly 修饰，这样模式匹配的时候也得加上 readonly 才行。

// 实现一个 ParseQueryString a=1&b=2&c=3 ===> {a:1;b:2;c:3}
type ParseParam<Str extends string> = Str extends `${infer Key}=${infer Value}` ? { [K in Key]: Value } : {}
type MergeValue<One, Other> = One extends Other ? One : Other extends unknown[] ? [One, ...Other] : [One, Other]
type MergeParam<Param1 extends Record<string, any>, Param2 extends Record<string, any>> = {
    [Key in keyof Param1 | keyof Param2]:
    Key extends keyof Param1
    ? Key extends keyof Param2
    ? MergeValue<Param1[Key], Param2[Key]>
    : Param1[Key]
    : Key extends keyof Param2
    ? Param2[Key]
    : never
}
type ParseQueryString<Str extends string> = Str extends `${infer Param}&${infer Rest}`
    ? MergeParam<ParseParam<Param>, ParseQueryString<Rest>> : ParseParam<Str>

type Test = ParseQueryString<'a=1&a=2&b=3&c=5'> // {a: ["1", "2"];b: "3";c: "5";}

// 提取函数类型的参数类型
type TParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never
type TestP = TParameters<(name: string, age: number) => {}>

// 提取函数类型的返回值类型
type TReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never
type TestR = TReturnType<(name: string, age: number) => 'dong'>

// 提取构造器的参数类型
type ConParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never

// 联合类型中去除一部分类型
type TExclude<T, U> = T extends U ? never : T
type TestEx = TExclude<'a' | 'b' | 'c', 'a' | 'c'>

// 数组分组
type Chunk<Arr extends unknown[], Len extends number, curItem extends unknown[] = [], Result extends unknown[] = [],> = Arr extends [infer First, ...infer Rest] ?
    curItem["length"] extends Len ?
    Chunk<Rest, Len, [First], [...Result, curItem]> : Chunk<Rest, Len, [First, ...curItem], Result> :
    [...Result, curItem]

type TestChunk = Chunk<[1, 2, 3, 4, 5, 6, 7], 3>


type PartialObjectPropByKeys<
    Obj extends Record<string, any>,
    Key extends keyof Obj
    > = MyCopy<Partial<Pick<Obj, Extract<keyof Obj, Key>>> & Omit<Obj, Key>>;

interface Dong {
    name: string;
    age: number;
    address: string;
}

type MyCopy<Obj extends Record<string, any>> = {
    [K in keyof Obj]: Obj[K];
};

type p66 = PartialObjectPropByKeys<Dong, "name">;

// 函数重载 返回的是最后一个重载的返回值类型
type res = ReturnType<((name: string) => string) & ((name: number) => number)>

// 联合转交叉
type UnionToInter<U> = (U extends U ? (x: U) => unknown : never) extends (x: infer R) => unknown ? R : never

type UnionToIntersection<U> =
    (U extends U ? (x: U) => unknown : never) extends (x: infer R) => unknown
    ? R
    : never
type TestUnionT = UnionToIntersection<number | string>
type UnionToFuncIntersection<T> = UnionToIntersection<T extends any ? () => T : never>;
type TestUnionTF = UnionToFuncIntersection<number | string>


// 联合转元组
type UnionTurple<U> = UnionToIntersection<U extends any ? () => U : never> extends () => infer ReturnType ? [...UnionTurple<Exclude<U, ReturnType>>, ReturnType] : []
type TestU = UnionTurple<'1' | '2' | '3'>

// 字符串连接
declare function join<Devider extends string>(devider: Devider): <Items extends string[]>(...items: Items) => StrJoin<Items, Devider>

type StrJoin<Items extends any[], Devider extends string, Result extends string = ''> =
    Items extends [infer Cur, ...infer Rest] ? StrJoin<Rest, Devider, `${Result}${Devider}${Cur & string}`> : Result extends `${Devider}${infer ResStr}` ? ResStr : Result

type res4 = StrJoin<['1', '2', '3'], '-'>

let res5 = join('-')('1', '2', '3')

// 索引
type DeepCamelize<Obj extends Record<string, any>> = Obj extends any ? {
    [Key in keyof Obj as Key extends `${infer First}_${infer Rest}` ? `${First}${Capitalize<Rest>}` : Key]: DeepCamelize<Obj[Key]>
} : never
type obj = {
    aaa_bbb: string;
    bbb_ccc: {
        eee_fff: {
            fff_ggg: string;
        }
    }
}
type TestDeepC = DeepCamelize<obj>

type AllKeyPath<Obj extends Record<string, any>> =  {
    [Key in keyof Obj]:
    Key extends string
    ? Obj[Key] extends Record<string, any>
    ? Key | `${Key}.${AllKeyPath<Obj[Key]>}`
    : Key
    : never
}[keyof Obj]
type testAll = AllKeyPath<obj>

// 两个索引合并
type A1 = {
    aaa: 11;
    bbb: 22;
}
type B1 = {
    aaa: 11;
    ccc: 22;
}
type Defaultize<A extends Record<string, any>, B extends Record<string, any>> = Pick<A, Exclude<keyof A, keyof B>> & Partial<Pick<A, Extract<keyof A, keyof B>>> & Partial<Pick<B, Exclude<keyof B, keyof A>>>
type Copy<Obj extends Record<string, any>> = {
    [Key in keyof Obj]: Obj[Key]
}
type TestCo = Copy<Defaultize<A1, B1>>

// 枚举
enum Code {
    a = 1,
    b = 2,
    c = 'ee'
}
type code = `${Code}` // "1"|"2"|"ee"

type StrToNum<Str> = Str extends `${infer Num extends number}` ? Num : Str
type TCode = StrToNum<`${Code}`> // "ee"|1|2