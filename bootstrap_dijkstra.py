import _thread
from distutils.log import error 
from enum import Enum
from __future__ import annotations
from turtle import right

mutex = _thread.allocate_lock()

class NodeChild(Enum):
  LEFT = 0
  RIGHT = 1

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
    self.reachable = False
    # self.__leftmutex = _thread.allocate_lock()
    # self.__rightmutex = _thread.allocate_lock()
    # self.__colormutex = _thread.allocate_lock()

  def shade(self: Node):
    # self.__colormutex.acquire()
    if (self.color == NodeColor.WHITE):
      self.color = NodeColor.GREY
    # self.__colormutex.release()
  
  def blacken(self: Node):
    if (self.color == NodeColor.GREY):
      self.color = NodeColor.BLACK

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

  @property
  def color(self: Node):
    return self.color

class Graph:

  def __init__(self: Graph, num_nodes: int):
    self.num_nodes = num_nodes
    self.nodes: list(Node) = []
    self.collect_mutex = _thread.allocate_lock()

    # Add NIL
    self.NIL: Node = Node(0)
    self.NIL.left = self.NIL
    self.NIL.right = self.NIL
    self.nodes.append(self.NIL)
    self.NIL.reachable = True

    for i in range(1, self.__num_nodes):
      self.nodes.append(Node(i), self.NIL, self.NIL)
      self.nodes[i].reachable = True
    
    # 3 roots for some reason
    self.roots: list(Node) = self.nodes[1:4]
    # third root is our free list root
    self.free_list: Node = self.nodes[3]

    for i in range(4, self.num_nodes):
      self.nodes[i - 1].right = self.nodes[i]
    
  def pop_from_free_list(self: Graph) -> Node:
    target_node: Node = self.free_list.right
    self.free_list.right = target_node.right
    return target_node
  
  def allocate_free_node(self: Graph, node_id: int, node_child: NodeChild) -> int:
    if not self.nodes[node_id].reachable:
      # We're all
      return -1
    
    free_node = self.pop_from_free_list()

    if node_child == NodeChild.LEFT:
      self.nodes[node_id].left = free_node
    else:
      self.nodes[node_id].right = free_node
    
    return free_node.id

  def collect(self: Graph):
    for node in self.roots:
      node.shade()

    i = 0
    k = self.num_nodes

    while (k > 0):
      c = self.nodes[i]
      if c == NodeColor.GREY:
        k = self.num_nodes
        self.collect_mutex.acquire()
        self.nodes[i].left.shade()
        self.nodes[i].right.shade()
        self.nodes[i].blacken()
        self.collect_mutex.release()
      else:
        k -= 1

      


    