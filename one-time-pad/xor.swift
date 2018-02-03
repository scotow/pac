import Foundation

extension Data {
    static func ^(lhs: Data, rhs: Data) -> Data {
        var result = Data()
        for index in 0..<Swift.min(lhs.count, rhs.count) {
            result.append(lhs[index] ^ rhs[index])
        }

        return result
    }
}

struct File {
    let data: Data

    var size: Int {
        return data.count
    }

    subscript(index: Int) -> UInt8 {
        return data[index]
    }

    init(data: Data) {
        self.data = data
    }

    init?(fromFile file: String) {
        guard
            let base64 = try? String(contentsOfFile: file, encoding: .utf8),
            let data = Data(base64Encoded: base64, options: .ignoreUnknownCharacters) else {
            return nil
        }

        self.data = data
    }

    static func ^(lhs: File, rhs: File) -> File {
        return File(data: lhs.data ^ rhs.data)
    }
}

extension UInt8 {
    var charValue: String {
        return self == 10 ? "\\n" : String(describing: Unicode.Scalar(self))
    }

    func valueFrom(_ char: String) -> String {
        return String(describing: Unicode.Scalar(UInt8(Character(char).unicodeScalars.first!.value) ^ self))
    }

    func possibleValuesFromBinary() -> String {
        return (self ^ 48).charValue + "\t" + (self ^ 49).charValue
    }
}

// let files: [File] = CommandLine.arguments[1...].flatMap(File.init(fromFile:))
//
// guard files.count >= 2 else {
//     fatalError("Number of files incorrect.")
// }

guard
    let fileA = File(fromFile: CommandLine.arguments[1]),
    let fileB = File(fromFile: CommandLine.arguments[2]) else {
    fatalError("Cannot load files.")
}

// print(fileA.size)
// print(fileB[0])


let mixed: Data = (fileA ^ fileB).data
print(mixed[0].valueFrom("P"))
print(mixed[1].valueFrom("1"))
print(mixed[2].valueFrom("\n"))
print("?")
print("?")
print(mixed[5].valueFrom(" "))
print("?")
print("?")
print(mixed[8].valueFrom("\n"))

mixed[8...].forEach {
    print($0.possibleValuesFromBinary(), separator: "\t")
    // if($0 ^ 48 == 10 || $0 ^ 49 == 10) {
    //     print("Probably \\n")
    // } else if($0 ^ 48 == 32 || $0 ^ 49 == 32) {
    //     print("Probably SPACE")
    // } else {
    //     print("Other")
    // }
}

//(fileB.data ^ mask).forEach { print($0) }
// print(String(data: fileB.data ^ mask, encoding: .utf8) ?? "No data")


// (fileA ^ fileB).data.forEach { print($0) }

// A: 5
// 101
//
// B: 6
// 110
//
// C: A ^ B
// 011
//
// A: C ^ B
// 101
//
// B: C ^ A
// 110
