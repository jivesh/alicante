import _thread 
from enum import Enum
from __future__ import annotations

mutex = _thread.allocate_lock()

class NodeColor(Enum):
  WHITE = 0
  GREY = 1
  BLACK = 2

class Node:
  
  def __init__(self: Node, id: int, left: Node = None, right: Node = None):
    self.__id = id
    self.__left = left
    self.__right = right
    self.color = NodeColor.WHITE
    # self.__leftmutex = _thread.allocate_lock()
    # self.__rightmutex = _thread.allocate_lock()
    # self.__colormutex = _thread.allocate_lock()

  def shade(self: Node):
    # self.__colormutex.acquire()
    if (self.color == NodeColor.WHITE):
      self.color = NodeColor.GREY
    # self.__colormutex.release()

  @property
  def left(self: Node) -> Node:
    return self.__left

  @left.setter
  def left(self: Node, newleft: Node):
    # self.__leftmutex.acquire()
    self.__left = newleft
    # self.__leftmutex.release()

  @property
  def right(self: Node) -> Node:
    return self.__right

  @right.setter
  def right(self: Node, newright: Node):
    # self.__rightmutex.acquire()
    self.__right = newright
    # self.__rightmutex.release()

  @property
  def id(self: Node):
    return self.__id

class Graph:

  def __init__(self: Graph, num_nodes: int):
    self.num_nodes = num_nodes
    self.nodes = []

    # Add NIL
    self.NIL = Node(0)
    self.NIL.left = self.NIL
    self.NIL.right = self.NIL
    self.nodes.append(self.NIL)

    for i in range(1, self.__num_nodes):
      self.nodes.append(Node(i), self.NIL, self.NIL)
    
    # 3 roots for some reason
    self.roots = self.nodes[1:4]
    # third root is our free list root
    self.free_list = self.nodes[3]

    



    